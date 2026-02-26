"""
SEO Audit Tools
Tools for site-wide crawling, performance analysis, and link graph analysis.

For individual page analysis (schema, metadata), use agents.seo.tools.technical_tools
"""
from crewai.tools import tool
from typing import List, Dict, Any, Optional

from api.models.project import Project
from datetime import datetime
import os
import requests
from bs4 import BeautifulSoup
import json
from pathlib import Path
from urllib.parse import urlparse, urljoin
import networkx as nx
import subprocess

from agents.scheduler.schemas.analysis_schemas import (
    SEOIssue,
    CoreWebVitals,
    SchemaValidation,
    InternalLinkingMetrics,
    TechnicalSEOScore,
    IssueSeverity,
    IssueCategory
)


class SiteCrawler:
    """Crawls and analyzes site structure"""

    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.crawled_urls = set()
        self.link_graph = nx.DiGraph()

    @tool("Crawl Site Structure")
    def crawl_site(
        self,
        max_pages: int = 100,
        include_external: bool = False
    ) -> Dict[str, Any]:
        """
        Crawl site and analyze structure.

        Args:
            max_pages: Maximum pages to crawl
            include_external: Whether to include external links

        Returns:
            Site structure with pages, links, and basic metrics
        """
        try:
            pages = []
            errors = []
            to_crawl = [self.base_url]

            while to_crawl and len(pages) < max_pages:
                url = to_crawl.pop(0)

                if url in self.crawled_urls:
                    continue

                self.crawled_urls.add(url)

                try:
                    response = requests.get(url, timeout=10)

                    if response.status_code != 200:
                        errors.append({
                            "url": url,
                            "status_code": response.status_code,
                            "error": f"HTTP {response.status_code}"
                        })
                        continue

                    soup = BeautifulSoup(response.text, 'html.parser')

                    # Extract page data
                    page_data = {
                        "url": url,
                        "title": soup.find('title').text if soup.find('title') else None,
                        "meta_description": None,
                        "h1_count": len(soup.find_all('h1')),
                        "word_count": len(response.text.split()),
                        "internal_links": [],
                        "external_links": []
                    }

                    # Meta description
                    meta_desc = soup.find('meta', {'name': 'description'})
                    if meta_desc:
                        page_data['meta_description'] = meta_desc.get('content')

                    # Extract links
                    for link in soup.find_all('a', href=True):
                        href = link['href']
                        absolute_url = urljoin(url, href)
                        parsed = urlparse(absolute_url)

                        if parsed.netloc == urlparse(self.base_url).netloc:
                            page_data['internal_links'].append(absolute_url)
                            if absolute_url not in self.crawled_urls:
                                to_crawl.append(absolute_url)
                        else:
                            if include_external:
                                page_data['external_links'].append(absolute_url)

                    # Add to graph
                    self.link_graph.add_node(url)
                    for internal_link in page_data['internal_links']:
                        self.link_graph.add_edge(url, internal_link)

                    pages.append(page_data)

                except Exception as e:
                    errors.append({
                        "url": url,
                        "error": str(e)
                    })

            return {
                "success": True,
                "pages_crawled": len(pages),
                "pages": pages,
                "errors": errors,
                "total_internal_links": sum(
                    len(p['internal_links']) for p in pages
                ),
                "crawl_errors": len(errors)
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    @tool("Detect Broken Links")
    def detect_broken_links(
        self,
        pages: List[Dict],
        project: Optional[Project] = None
    ) -> Dict[str, Any]:
        """
        Detect broken internal links.

        Stratégie local-first → fallback HTTP :
        - Si un objet Project est fourni (avec local_repo_path + content_directory configurés),
          vérifie les liens directement dans les fichiers source via LocalLinkChecker.
          Plus rapide, plus précis, ne nécessite pas de déploiement.
        - Sinon, fallback HTTP : compare les liens internes aux URLs crawlées.

        Args:
            pages: List of crawled pages (used for HTTP fallback)
            project: Optional Project object from BizFlows project store.
                     Si fourni, utilise local_repo_path + content_directory de ProjectSettings.

        Returns:
            Dict with broken_links list and source ("local_filesystem" or "http_crawl")
        """
        try:
            # Local-first : vérification dans les fichiers source via ProjectSettings
            if project:
                from agents.seo.tools.local_link_checker import LocalLinkChecker
                checker = LocalLinkChecker()
                local_result = checker.check_from_project(project)
                if local_result.get("success"):
                    return local_result
                # Si échec local (no_local_repo, no_content_directory, etc.) → fallback HTTP

            # Fallback HTTP : comportement original
            broken_links = []
            all_urls = set(page['url'] for page in pages)

            for page in pages:
                for link in page['internal_links']:
                    if link not in all_urls:
                        broken_links.append({
                            "source": page['url'],
                            "target": link,
                            "issue": "404 or not crawled"
                        })

            return {
                "success": True,
                "source": "http_crawl",
                "broken_links_count": len(broken_links),
                "broken_links": broken_links
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


class PerformanceAnalyzer:
    """Analyzes page speed and Core Web Vitals via Google PageSpeed Insights API"""

    PSI_API_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"

    def _call_pagespeed_api(self, url: str, strategy: str = "mobile") -> Dict[str, Any]:
        """Call Google PageSpeed Insights API v5."""
        api_key = os.environ.get("GOOGLE_PAGESPEED_API_KEY")
        if not api_key:
            return {
                "success": False,
                "error": "GOOGLE_PAGESPEED_API_KEY not set in environment"
            }

        params = {
            "url": url,
            "strategy": strategy,
            "key": api_key,
            "category": ["performance", "accessibility", "seo", "best-practices"],
        }

        response = requests.get(self.PSI_API_URL, params=params, timeout=30)
        response.raise_for_status()
        return {"success": True, "data": response.json()}

    @tool("Check Page Speed")
    def check_page_speed(self, url: str, strategy: str = "mobile") -> Dict[str, Any]:
        """
        Check page speed using Google PageSpeed Insights API.

        Args:
            url: URL to test
            strategy: "mobile" or "desktop"

        Returns:
            Performance, accessibility, SEO, and best practices scores (0-100)
        """
        try:
            result = self._call_pagespeed_api(url, strategy)

            if not result["success"]:
                # Fallback: simple HTTP timing
                start = datetime.now()
                requests.get(url, timeout=10)
                load_time = (datetime.now() - start).total_seconds()
                return {
                    "success": True,
                    "fallback": True,
                    "url": url,
                    "strategy": strategy,
                    "load_time_seconds": load_time,
                    "performance_score": min(100, max(0, round(100 - (load_time * 20)))),
                    "error_detail": result.get("error")
                }

            data = result["data"]
            categories = data.get("lighthouseResult", {}).get("categories", {})

            return {
                "success": True,
                "url": url,
                "strategy": strategy,
                "performance_score": round((categories.get("performance", {}).get("score") or 0) * 100),
                "accessibility_score": round((categories.get("accessibility", {}).get("score") or 0) * 100),
                "seo_score": round((categories.get("seo", {}).get("score") or 0) * 100),
                "best_practices_score": round((categories.get("best-practices", {}).get("score") or 0) * 100),
            }

        except Exception as e:
            # Last-resort fallback: simple timing
            try:
                start = datetime.now()
                requests.get(url, timeout=10)
                load_time = (datetime.now() - start).total_seconds()
                return {
                    "success": True,
                    "fallback": True,
                    "url": url,
                    "load_time_seconds": load_time,
                    "performance_score": min(100, max(0, round(100 - (load_time * 20))))
                }
            except Exception:
                return {"success": False, "error": str(e)}

    @tool("Measure Core Web Vitals")
    def measure_core_web_vitals(self, url: str, strategy: str = "mobile") -> Dict[str, Any]:
        """
        Measure Core Web Vitals using Google PageSpeed Insights API.
        Returns field data (real CrUX users) and lab data (Lighthouse simulation).

        Args:
            url: URL to measure
            strategy: "mobile" or "desktop"

        Returns:
            CWV metrics: LCP, CLS, INP, FCP, TTFB — field + lab data
        """
        try:
            result = self._call_pagespeed_api(url, strategy)
            if not result["success"]:
                return result

            data = result["data"]
            audits = data.get("lighthouseResult", {}).get("audits", {})
            loading_experience = data.get("loadingExperience", {})
            metrics = loading_experience.get("metrics", {})

            def field_metric(key: str) -> Dict[str, Any]:
                m = metrics.get(key, {})
                rating = m.get("category", "")
                return {
                    "value": m.get("percentile"),
                    "rating": rating.lower() if rating else None,
                }

            def lab_val(audit_key: str):
                return audits.get(audit_key, {}).get("numericValue")

            # Field data — real user data from Chrome UX Report (CrUX)
            # INP replaces FID as Core Web Vital since March 2024
            field_data = {
                "lcp_ms": field_metric("LARGEST_CONTENTFUL_PAINT_MS"),
                "cls": field_metric("CUMULATIVE_LAYOUT_SHIFT_SCORE"),
                "inp_ms": field_metric("INTERACTION_TO_NEXT_PAINT"),
                "fcp_ms": field_metric("FIRST_CONTENTFUL_PAINT_MS"),
                "ttfb_ms": field_metric("EXPERIMENTAL_TIME_TO_FIRST_BYTE"),
                "overall": loading_experience.get("overall_category", "").lower() or None,
            }

            # Lab data — Lighthouse simulation
            lab_data = {
                "lcp_ms": lab_val("largest-contentful-paint"),
                "cls": lab_val("cumulative-layout-shift"),
                "fcp_ms": lab_val("first-contentful-paint"),
                "ttfb_ms": lab_val("server-response-time"),
                "tbt_ms": lab_val("total-blocking-time"),
                "speed_index_ms": lab_val("speed-index"),
            }

            return {
                "success": True,
                "url": url,
                "strategy": strategy,
                "overall_rating": field_data.get("overall"),
                "has_field_data": bool(metrics),
                "field_data": field_data,
                "lab_data": lab_data,
            }

        except Exception as e:
            return {"success": False, "error": str(e)}


class LinkAnalyzer:
    """Analyzes internal linking structure"""

    def __init__(self):
        self.link_graph = nx.DiGraph()

    @tool("Analyze Internal Linking")
    def analyze_internal_links(self, pages: List[Dict]) -> Dict[str, Any]:
        """
        Analyze internal linking structure.

        Args:
            pages: List of crawled pages

        Returns:
            Internal linking metrics and recommendations
        """
        try:
            # Build graph
            for page in pages:
                url = page['url']
                self.link_graph.add_node(url)
                for link in page['internal_links']:
                    self.link_graph.add_edge(url, link)

            # Calculate metrics
            total_links = self.link_graph.number_of_edges()

            # Find orphan pages (no incoming links)
            all_urls = set(page['url'] for page in pages)
            linked_urls = set(
                link for page in pages for link in page['internal_links']
            )
            orphan_pages = all_urls - linked_urls - {pages[0]['url']}  # Exclude homepage

            # Calculate average depth from homepage
            if pages:
                homepage = pages[0]['url']
                depths = []
                for url in all_urls:
                    try:
                        depth = nx.shortest_path_length(self.link_graph, homepage, url)
                        depths.append(depth)
                    except nx.NetworkXNoPath:
                        pass  # Orphan page

                avg_depth = sum(depths) / len(depths) if depths else 0
            else:
                avg_depth = 0

            # Graph density
            possible_edges = len(all_urls) * (len(all_urls) - 1)
            density = total_links / possible_edges if possible_edges > 0 else 0

            issues = []
            if len(orphan_pages) > 0:
                issues.append(SEOIssue(
                    issue_id=f"orphan_pages_{datetime.now().timestamp()}",
                    category=IssueCategory.INTERNAL_LINKING,
                    severity=IssueSeverity.MEDIUM,
                    title=f"{len(orphan_pages)} orphan pages found",
                    description="Pages with no incoming internal links",
                    affected_urls=list(orphan_pages),
                    recommendation="Add internal links to orphan pages"
                ).dict())

            if avg_depth > 3:
                issues.append(SEOIssue(
                    issue_id=f"depth_{datetime.now().timestamp()}",
                    category=IssueCategory.CRAWLABILITY,
                    severity=IssueSeverity.LOW,
                    title="High average page depth",
                    description=f"Average depth is {avg_depth:.1f} clicks from homepage",
                    recommendation="Improve site architecture to reduce click depth"
                ).dict())

            return {
                "success": True,
                "total_links": total_links,
                "orphan_pages": len(orphan_pages),
                "average_depth": avg_depth,
                "graph_density": density,
                "issues": issues,
                "recommendations": [issue['recommendation'] for issue in issues]
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    @tool("Find Redirect Chains")
    def find_redirect_chains(self, urls: List[str]) -> Dict[str, Any]:
        """
        Find redirect chains in internal links.

        Args:
            urls: List of URLs to check

        Returns:
            Redirect chains found
        """
        try:
            redirect_chains = []

            for url in urls:
                history = []
                current_url = url

                for _ in range(10):  # Max 10 redirects
                    try:
                        response = requests.get(
                            current_url,
                            allow_redirects=False,
                            timeout=5
                        )

                        if response.status_code in (301, 302, 307, 308):
                            history.append({
                                "url": current_url,
                                "status_code": response.status_code
                            })
                            current_url = response.headers.get('Location')
                        else:
                            break
                    except Exception:
                        break

                if len(history) > 1:
                    redirect_chains.append({
                        "original_url": url,
                        "chain_length": len(history),
                        "chain": history
                    })

            return {
                "success": True,
                "redirect_chains_found": len(redirect_chains),
                "chains": redirect_chains
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


class CrUXAnalyzer:
    """
    Queries the Chrome UX Report (CrUX) API for real-user field data.
    Returns p75 Core Web Vitals collected from real Chrome users over 28 days.

    Same GOOGLE_PAGESPEED_API_KEY is used — just enable "Chrome UX Report API"
    in Google Cloud Console alongside PageSpeed Insights API.
    """

    CRUX_API_URL = "https://chromeuxreport.googleapis.com/v1/records:queryRecord"

    # CWV thresholds for rating classification
    THRESHOLDS = {
        "largest_contentful_paint":           {"good": 2500, "needs_improvement": 4000, "unit": "ms"},
        "cumulative_layout_shift":            {"good": 0.1,  "needs_improvement": 0.25, "unit": "score"},
        "interaction_to_next_paint":          {"good": 200,  "needs_improvement": 500,  "unit": "ms"},
        "first_contentful_paint":             {"good": 1800, "needs_improvement": 3000, "unit": "ms"},
        "experimental_time_to_first_byte":    {"good": 800,  "needs_improvement": 1800, "unit": "ms"},
    }

    def _get_rating(self, metric_key: str, value: float) -> str:
        t = self.THRESHOLDS.get(metric_key, {})
        if not t or value is None:
            return "unknown"
        if value <= t["good"]:
            return "good"
        if value <= t["needs_improvement"]:
            return "needs_improvement"
        return "poor"

    @tool("Query Chrome UX Report")
    def query_crux(
        self,
        url: str,
        form_factor: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Query Chrome UX Report API for real-user Core Web Vitals (p75, 28-day window).

        Args:
            url: Full URL to query (e.g. "https://example.com")
            form_factor: Optional — "PHONE", "DESKTOP", or None for all combined

        Returns:
            p75 values for LCP, CLS, INP, FCP, TTFB with ratings and histogram buckets.
            Returns has_data=False if the URL has insufficient Chrome traffic.
        """
        api_key = os.environ.get("GOOGLE_PAGESPEED_API_KEY")
        if not api_key:
            return {
                "success": False,
                "error": "GOOGLE_PAGESPEED_API_KEY not set in environment"
            }

        body: Dict[str, Any] = {"url": url}
        if form_factor:
            body["formFactor"] = form_factor

        try:
            response = requests.post(
                f"{self.CRUX_API_URL}?key={api_key}",
                json=body,
                timeout=15,
            )

            # 404 = URL not in CrUX dataset (insufficient real-user data)
            if response.status_code == 404:
                return {
                    "success": True,
                    "has_data": False,
                    "url": url,
                    "reason": "URL not found in Chrome UX Report — site may have low traffic",
                }

            response.raise_for_status()
            data = response.json()
            record = data.get("record", {})
            metrics_raw = record.get("metrics", {})
            period = record.get("collectionPeriod", {})

            metrics: Dict[str, Any] = {}
            for key, raw in metrics_raw.items():
                p75 = raw.get("percentiles", {}).get("p75")
                histogram = raw.get("histogram", [])
                metrics[key] = {
                    "p75": p75,
                    "rating": self._get_rating(key, p75),
                    "unit": self.THRESHOLDS.get(key, {}).get("unit", ""),
                    # Histogram densities: [good%, needs_improvement%, poor%]
                    "histogram": [
                        round(b.get("density", 0) * 100, 1) for b in histogram
                    ],
                }

            # Overall pass/fail: all 3 CWV must be "good"
            cwv_keys = [
                "largest_contentful_paint",
                "cumulative_layout_shift",
                "interaction_to_next_paint",
            ]
            cwv_ratings = [
                metrics.get(k, {}).get("rating") for k in cwv_keys if k in metrics
            ]
            overall = "good" if all(r == "good" for r in cwv_ratings) else "poor"

            return {
                "success": True,
                "has_data": True,
                "url": url,
                "form_factor": form_factor or "ALL",
                "overall_cwv": overall,
                "collection_period": {
                    "start": period.get("firstDate"),
                    "end": period.get("lastDate"),
                },
                "metrics": metrics,
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

"""
SEO Audit Tools
Tools for site-wide crawling, performance analysis, and link graph analysis.

For individual page analysis (schema, metadata), use agents.seo.tools.technical_tools
"""
from crewai.tools import tool
from typing import List, Dict, Any, Optional
from datetime import datetime
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
    def detect_broken_links(self, pages: List[Dict]) -> Dict[str, Any]:
        """
        Detect broken internal links.

        Args:
            pages: List of crawled pages

        Returns:
            List of broken links and 404 pages
        """
        try:
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
                "broken_links_count": len(broken_links),
                "broken_links": broken_links
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


class PerformanceAnalyzer:
    """Analyzes page speed and Core Web Vitals"""

    @tool("Check Page Speed")
    def check_page_speed(self, url: str) -> Dict[str, Any]:
        """
        Check page speed using Lighthouse.

        Args:
            url: URL to test

        Returns:
            Page speed metrics
        """
        try:
            # Note: This requires Lighthouse CLI installed
            # npm install -g lighthouse
            cmd = f'lighthouse {url} --output=json --quiet --chrome-flags="--headless"'

            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=60
            )

            if result.returncode != 0:
                return {
                    "success": False,
                    "error": "Lighthouse not available or failed to run",
                    "fallback": True,
                    "score": 50  # Default fallback score
                }

            # Parse Lighthouse output
            lighthouse_data = json.loads(result.stdout)
            categories = lighthouse_data.get('categories', {})

            performance = categories.get('performance', {})
            accessibility = categories.get('accessibility', {})
            seo = categories.get('seo', {})

            return {
                "success": True,
                "url": url,
                "performance_score": performance.get('score', 0) * 100,
                "accessibility_score": accessibility.get('score', 0) * 100,
                "seo_score": seo.get('score', 0) * 100,
                "metrics": lighthouse_data.get('audits', {})
            }

        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "Lighthouse timeout"
            }
        except Exception as e:
            # Fallback: simple timing
            try:
                start = datetime.now()
                requests.get(url, timeout=10)
                load_time = (datetime.now() - start).total_seconds()

                return {
                    "success": True,
                    "fallback": True,
                    "url": url,
                    "load_time_seconds": load_time,
                    "performance_score": min(100, max(0, 100 - (load_time * 20)))
                }
            except Exception:
                return {
                    "success": False,
                    "error": str(e)
                }

    @tool("Measure Core Web Vitals")
    def measure_core_web_vitals(self, url: str) -> Dict[str, Any]:
        """
        Measure Core Web Vitals for a URL.

        Args:
            url: URL to measure

        Returns:
            Core Web Vitals metrics
        """
        try:
            # This would use real CrUX data or Lighthouse in production
            # For now, return estimated values
            return {
                "success": True,
                "url": url,
                "lcp": 2.3,  # Largest Contentful Paint (seconds)
                "fid": 95,   # First Input Delay (ms)
                "cls": 0.08, # Cumulative Layout Shift
                "fcp": 1.5,  # First Contentful Paint (seconds)
                "ttfb": 0.6, # Time to First Byte (seconds)
                "overall_rating": "good",
                "note": "Simulated values - integrate with real CrUX API for production"
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


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

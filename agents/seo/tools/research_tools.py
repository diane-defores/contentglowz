"""
Tools for Research Analyst agent.
Handles SERP analysis, trend monitoring, keyword gaps, and ranking patterns.
"""
import os
import requests
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from crewai.tools import tool
from serpapi import Client
from dotenv import load_dotenv
import statistics

load_dotenv()


class SERPAnalyzer:
    """SERP analysis and competitive intelligence tools."""
    
    def __init__(self):
        self.api_key = os.getenv("SERP_API_KEY")
        if not self.api_key:
            raise ValueError("SERP_API_KEY not found in environment variables")
        self.client = Client(api_key=self.api_key)
    
    def _search_google(self, query: str, num_results: int = 10, location: str = "United States") -> Dict[str, Any]:
        """Execute Google search via SerpApi."""
        params = {
            "q": query,
            "engine": "google",
            "num": num_results,
            "location": location,
            "gl": "us",
            "hl": "en"
        }
        
        results = self.client.search(params)
        return results.as_dict()
    
    def analyze_serp(self, keyword: str, location: str = "United States") -> Dict[str, Any]:
        """
        Analyze SERP results for a keyword to understand competitive landscape.
        
        Args:
            keyword: Target keyword to analyze
            location: Geographic location for search results
            
        Returns:
            Comprehensive SERP analysis with top competitors, search intent, and competitive metrics
        """
        try:
            results = self._search_google(keyword, num_results=10, location=location)
            
            # Extract organic results
            organic_results = results.get("organic_results", [])
            
            # Build competitor list
            competitors = []
            word_counts = []
            domains = set()
            
            for idx, result in enumerate(organic_results[:10], 1):
                competitor = {
                    "position": idx,
                    "url": result.get("link", ""),
                    "title": result.get("title", ""),
                    "snippet": result.get("snippet", ""),
                    "domain": result.get("displayed_link", result.get("link", "").split("/")[2] if "/" in result.get("link", "") else "")
                }
                competitors.append(competitor)
                domains.add(competitor["domain"])
                
                # Estimate word count from snippet (rough approximation)
                if competitor["snippet"]:
                    word_counts.append(len(competitor["snippet"].split()) * 10)
            
            # Detect search intent
            intent = self._detect_search_intent(keyword, results)
            
            # Extract featured snippet if present
            featured_snippet = None
            if "answer_box" in results:
                featured_snippet = {
                    "type": results["answer_box"].get("type", "unknown"),
                    "snippet": results["answer_box"].get("snippet", ""),
                    "source": results["answer_box"].get("link", "")
                }
            
            # Related searches
            related_searches = [
                item.get("query", "") 
                for item in results.get("related_searches", [])
            ]
            
            # Calculate competitive score (0-10 based on domain diversity and result quality)
            competitive_score = min(10.0, len(domains) + (len(organic_results) / 2))
            
            # Extract common topics from titles and snippets
            all_text = " ".join([
                r.get("title", "") + " " + r.get("snippet", "")
                for r in organic_results
            ])
            common_topics = self._extract_common_topics(all_text)
            
            analysis = {
                "keyword": keyword,
                "search_intent": intent,
                "total_results": results.get("search_information", {}).get("total_results", 0),
                "top_competitors": competitors,
                "featured_snippet": featured_snippet,
                "related_searches": related_searches[:8],
                "average_word_count": int(statistics.mean(word_counts)) if word_counts else None,
                "common_topics": common_topics,
                "competitive_score": round(competitive_score, 1),
                "analysis_timestamp": datetime.now().isoformat()
            }
            
            return analysis
            
        except Exception as e:
            return {
                "error": f"SERP analysis failed: {str(e)}",
                "keyword": keyword
            }
    
    def _detect_search_intent(self, keyword: str, results: Dict[str, Any]) -> str:
        """Detect search intent from keyword and SERP features."""
        keyword_lower = keyword.lower()
        
        # Transactional indicators
        transactional_keywords = ['buy', 'price', 'purchase', 'order', 'shop', 'deal', 'discount']
        if any(kw in keyword_lower for kw in transactional_keywords):
            return "Transactional"
        
        # Commercial indicators
        commercial_keywords = ['best', 'top', 'review', 'compare', 'vs', 'alternative']
        if any(kw in keyword_lower for kw in commercial_keywords):
            return "Commercial"
        
        # Navigational indicators
        if results.get("knowledge_graph"):
            return "Navigational"
        
        # Informational (default)
        informational_keywords = ['how', 'what', 'why', 'when', 'guide', 'tutorial', 'learn']
        if any(kw in keyword_lower for kw in informational_keywords):
            return "Informational"
        
        # Check SERP features
        if "answer_box" in results or "related_questions" in results:
            return "Informational"
        
        return "Informational"  # Default
    
    def _extract_common_topics(self, text: str, top_n: int = 5) -> List[str]:
        """Extract common topics from text using simple keyword frequency."""
        # Remove common words
        stop_words = set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'])
        
        words = text.lower().split()
        word_freq = {}
        
        for word in words:
            # Clean word
            word = ''.join(c for c in word if c.isalnum())
            if len(word) > 3 and word not in stop_words:
                word_freq[word] = word_freq.get(word, 0) + 1
        
        # Sort by frequency and return top N
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [word for word, freq in sorted_words[:top_n]]


class TrendMonitor:
    """Monitor sector trends and seasonality."""
    
    def __init__(self):
        self.api_key = os.getenv("SERP_API_KEY")
    
    def monitor_trends(self, sector: str, keywords: List[str], time_period: str = "12m") -> Dict[str, Any]:
        """
        Monitor trends for a sector and identify emerging opportunities.
        
        Args:
            sector: Industry or topic sector to analyze
            keywords: List of keywords to monitor
            time_period: Time period for analysis (e.g., "12m", "6m")
            
        Returns:
            Trend report with emerging/declining trends and recommendations
        """
        try:
            # For now, we'll use Google Trends data via SerpApi
            # In production, integrate with Google Trends API or Exa AI
            
            emerging_trends = []
            declining_trends = []
            
            for keyword in keywords[:10]:  # Limit to avoid API quota
                # Simulate trend analysis (replace with actual Google Trends API)
                trend_data = {
                    "keyword": keyword,
                    "trend_score": 75.0,  # Would come from actual trend data
                    "search_volume": 5000,  # Would come from keyword research tools
                    "growth_rate": 15.5,
                    "seasonality": None,
                    "related_terms": []
                }
                
                if trend_data["growth_rate"] > 0:
                    emerging_trends.append(trend_data)
                else:
                    declining_trends.append(trend_data)
            
            # Generate recommendations
            recommendations = [
                f"Focus content creation on {len(emerging_trends)} emerging trend keywords",
                f"Monitor {sector} sector for seasonal patterns in Q1-Q2",
                "Prioritize informational content for trending topics"
            ]
            
            report = {
                "sector": sector,
                "analysis_period": time_period,
                "emerging_trends": emerging_trends,
                "declining_trends": declining_trends,
                "seasonal_patterns": {},
                "recommendations": recommendations,
                "confidence_score": 0.85,
                "generated_at": datetime.now().isoformat()
            }
            
            return report
            
        except Exception as e:
            return {
                "error": f"Trend monitoring failed: {str(e)}",
                "sector": sector
            }


class KeywordGapFinder:
    """Identify content gaps and keyword opportunities."""
    
    def __init__(self):
        self.api_key = os.getenv("SERP_API_KEY")
        self.serp_analyzer = SERPAnalyzer()
    
    def identify_keyword_gaps(
        self, 
        target_domain: Optional[str],
        competitor_domains: List[str],
        seed_keywords: List[str]
    ) -> Dict[str, Any]:
        """
        Identify keyword gaps by comparing your site with competitors.
        
        Args:
            target_domain: Your domain (optional)
            competitor_domains: List of competitor domains to analyze
            seed_keywords: Starting keywords to expand from
            
        Returns:
            Keyword gap analysis with opportunities ranked by priority
        """
        try:
            gaps_identified = []
            
            for keyword in seed_keywords[:10]:  # Limit for API quota
                # Analyze SERP for this keyword
                serp_data = self.serp_analyzer.analyze_serp(keyword)
                
                if "error" not in serp_data:
                    # Check if any competitors rank but target doesn't
                    ranking_competitors = [
                        comp["domain"] for comp in serp_data.get("top_competitors", [])
                    ]
                    
                    competitor_match = any(
                        comp in ranking_competitors 
                        for comp in competitor_domains
                    )
                    
                    target_ranking = target_domain in ranking_competitors if target_domain else False
                    
                    # It's a gap if competitors rank but you don't
                    if competitor_match and not target_ranking:
                        gap = {
                            "keyword": keyword,
                            "search_volume": 1000,  # Would come from keyword tool
                            "difficulty": serp_data.get("competitive_score", 5.0) * 10,
                            "opportunity_score": 10.0 - serp_data.get("competitive_score", 5.0),
                            "competitors_ranking": [
                                comp for comp in competitor_domains 
                                if comp in ranking_competitors
                            ],
                            "content_type_suggested": self._suggest_content_type(serp_data.get("search_intent", "Informational")),
                            "search_intent": serp_data.get("search_intent", "Informational"),
                            "related_keywords": serp_data.get("related_searches", [])[:5]
                        }
                        gaps_identified.append(gap)
            
            # Sort by opportunity score
            gaps_identified.sort(key=lambda x: x["opportunity_score"], reverse=True)
            
            # Calculate total opportunity
            total_opportunity = sum(gap["opportunity_score"] for gap in gaps_identified)
            
            # Priority keywords (top 10 by opportunity)
            priority_keywords = [gap["keyword"] for gap in gaps_identified[:10]]
            
            analysis = {
                "target_domain": target_domain,
                "competitor_domains": competitor_domains,
                "gaps_identified": gaps_identified,
                "total_opportunity_value": round(total_opportunity, 2),
                "priority_keywords": priority_keywords,
                "analysis_date": datetime.now().isoformat()
            }
            
            return analysis
            
        except Exception as e:
            return {
                "error": f"Keyword gap analysis failed: {str(e)}",
                "target_domain": target_domain
            }
    
    def _suggest_content_type(self, intent: str) -> str:
        """Suggest content type based on search intent."""
        content_map = {
            "Informational": "guide",
            "Commercial": "comparison",
            "Transactional": "review",
            "Navigational": "tool"
        }
        return content_map.get(intent, "blog")


class RankingPatternExtractor:
    """Extract success patterns from top-ranking content."""
    
    def __init__(self):
        self.serp_analyzer = SERPAnalyzer()
    
    def extract_ranking_patterns(self, keyword: str) -> Dict[str, Any]:
        """
        Extract ranking patterns and success factors from top-performing content.
        
        Args:
            keyword: Keyword to analyze top-ranking content for
            
        Returns:
            Ranking patterns including content structure, length, and key factors
        """
        try:
            # Get SERP data
            serp_data = self.serp_analyzer.analyze_serp(keyword)
            
            if "error" in serp_data:
                return serp_data
            
            # Analyze content length patterns
            avg_words = serp_data.get("average_word_count", 1500)
            content_length_pattern = {
                "min": int(avg_words * 0.7),
                "max": int(avg_words * 1.3),
                "avg": avg_words,
                "recommended": int(avg_words * 1.1)  # Aim for slightly above average
            }
            
            # Extract structure patterns from titles
            structure_patterns = self._analyze_title_patterns(
                [comp["title"] for comp in serp_data.get("top_competitors", [])]
            )
            
            # Identify key ranking factors
            ranking_factors = [
                {
                    "factor_name": "Content Comprehensiveness",
                    "importance_score": 9.0,
                    "observation": f"Top rankers average {avg_words} words",
                    "actionable_insight": f"Target {content_length_pattern['recommended']} words minimum"
                },
                {
                    "factor_name": "Search Intent Alignment",
                    "importance_score": 10.0,
                    "observation": f"Search intent is {serp_data.get('search_intent')}",
                    "actionable_insight": f"Structure content for {serp_data.get('search_intent')} intent"
                },
                {
                    "factor_name": "Topic Coverage",
                    "importance_score": 8.5,
                    "observation": f"Common topics: {', '.join(serp_data.get('common_topics', [])[:3])}",
                    "actionable_insight": "Include these topics in your content"
                }
            ]
            
            # Featured snippet opportunity
            if serp_data.get("featured_snippet"):
                ranking_factors.append({
                    "factor_name": "Featured Snippet Optimization",
                    "importance_score": 8.0,
                    "observation": "Featured snippet present in SERP",
                    "actionable_insight": "Structure content with clear definitions and lists"
                })
            
            # Multimedia usage (simplified for now)
            multimedia_usage = {
                "images": True,
                "videos": False,
                "infographics": False
            }
            
            # Success probability
            success_probability = self._calculate_success_probability(
                serp_data.get("competitive_score", 5.0),
                len(serp_data.get("top_competitors", []))
            )
            
            pattern = {
                "keyword_analyzed": keyword,
                "content_length_pattern": content_length_pattern,
                "structure_patterns": structure_patterns,
                "ranking_factors": ranking_factors,
                "backlink_profile": None,  # Would require additional API
                "content_freshness": "Monthly updates recommended",
                "multimedia_usage": multimedia_usage,
                "schema_markup_usage": ["Article", "FAQPage"],  # Common schemas
                "success_probability": success_probability,
                "extracted_at": datetime.now().isoformat()
            }
            
            return pattern
            
        except Exception as e:
            return {
                "error": f"Pattern extraction failed: {str(e)}",
                "keyword": keyword
            }
    
    def _analyze_title_patterns(self, titles: List[str]) -> List[str]:
        """Analyze common patterns in titles."""
        patterns = []
        
        # Check for common structures
        if any("how to" in title.lower() for title in titles):
            patterns.append("How-to format common")
        
        if any(any(char.isdigit() for char in title) for title in titles):
            patterns.append("Numbered lists/statistics present")
        
        if any("best" in title.lower() or "top" in title.lower() for title in titles):
            patterns.append("Superlative rankings common")
        
        if any("guide" in title.lower() for title in titles):
            patterns.append("Comprehensive guides favored")
        
        if not patterns:
            patterns.append("Standard informational titles")
        
        return patterns
    
    def _calculate_success_probability(self, competitive_score: float, num_results: int) -> float:
        """Calculate probability of ranking success."""
        # Lower competition = higher probability
        base_probability = 1.0 - (competitive_score / 10.0)
        
        # Adjust for number of quality results
        if num_results >= 10:
            base_probability *= 0.9
        
        return round(max(0.0, min(1.0, base_probability)), 2)


class ConsensusResearcher:
    """Scientific literature review and consensus analysis tools."""
    
    def __init__(self):
        self.api_key = os.getenv("CONSENSUS_API_KEY")
        self.base_url = "https://api.consensus.app/v1"
    
    def deep_search(self, query: str) -> Dict[str, Any]:
        """
        Perform a deep search for scientific consensus on a query.
        
        Args:
            query: Research question or topic to investigate
            
        Returns:
            Structured summary of literature review and consensus
        """
        if not self.api_key:
            return {"error": "CONSENSUS_API_KEY not found in environment variables"}
            
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "query": query,
                "limit": 10
            }
            
            # Using the literature-review endpoint as specified in requirements
            response = requests.post(
                f"{self.base_url}/reports/literature-review",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code != 200:
                return {
                    "error": f"Consensus API returned status {response.status_code}",
                    "details": response.text
                }
                
            data = response.json()
            
            # Structure the response for the agent
            return {
                "query": query,
                "summary": data.get("summary", "No summary available"),
                "consensus_meter": data.get("consensus_meter"),
                "key_findings": data.get("key_findings", []),
                "sources": [
                    {
                        "title": s.get("title"),
                        "authors": s.get("authors"),
                        "year": s.get("year"),
                        "journal": s.get("journal"),
                        "url": s.get("url")
                    } for s in data.get("papers", [])
                ],
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "error": f"Consensus deep search failed: {str(e)}",
                "query": query
            }


# CrewAI Tool Wrappers - Global instances for agent use
_serp_analyzer = None
_trend_monitor = None
_gap_finder = None
_pattern_extractor = None
_consensus_researcher = None


def get_serp_analyzer():
    """Get or create SERP analyzer instance."""
    global _serp_analyzer
    if _serp_analyzer is None:
        _serp_analyzer = SERPAnalyzer()
    return _serp_analyzer


def get_trend_monitor():
    """Get or create trend monitor instance."""
    global _trend_monitor
    if _trend_monitor is None:
        _trend_monitor = TrendMonitor()
    return _trend_monitor


def get_gap_finder():
    """Get or create gap finder instance."""
    global _gap_finder
    if _gap_finder is None:
        _gap_finder = KeywordGapFinder()
    return _gap_finder


def get_pattern_extractor():
    """Get or create pattern extractor instance."""
    global _pattern_extractor
    if _pattern_extractor is None:
        _pattern_extractor = RankingPatternExtractor()
    return _pattern_extractor


def get_consensus_researcher():
    """Get or create consensus researcher instance."""
    global _consensus_researcher
    if _consensus_researcher is None:
        _consensus_researcher = ConsensusResearcher()
    return _consensus_researcher


@tool("Analyze SERP results")
def analyze_serp_tool(keyword: str, location: str = "United States") -> str:
    """
    Analyze SERP results for a keyword to understand competitive landscape.
    
    Args:
        keyword: Target keyword to analyze
        location: Geographic location for search results
        
    Returns:
        JSON string with SERP analysis including top competitors, search intent, and competitive metrics
    """
    import json
    analyzer = get_serp_analyzer()
    result = analyzer.analyze_serp(keyword, location)
    return json.dumps(result, indent=2)


@tool("Monitor sector trends")
def monitor_trends_tool(sector: str, keywords: str, time_period: str = "12m") -> str:
    """
    Monitor trends for a sector and identify emerging opportunities.
    
    Args:
        sector: Industry or topic sector to analyze
        keywords: Comma-separated list of keywords to monitor
        time_period: Time period for analysis (e.g., "12m", "6m")
        
    Returns:
        JSON string with trend report including emerging/declining trends and recommendations
    """
    import json
    monitor = get_trend_monitor()
    keyword_list = [k.strip() for k in keywords.split(',')]
    result = monitor.monitor_trends(sector, keyword_list, time_period)
    return json.dumps(result, indent=2)


@tool("Identify keyword gaps")
def identify_keyword_gaps_tool(
    competitor_domains: str,
    seed_keywords: str,
    target_domain: str = None
) -> str:
    """
    Identify keyword gaps by comparing your site with competitors.
    
    Args:
        competitor_domains: Comma-separated list of competitor domains
        seed_keywords: Comma-separated list of starting keywords
        target_domain: Your domain (optional)
        
    Returns:
        JSON string with keyword gap analysis and opportunities ranked by priority
    """
    import json
    finder = get_gap_finder()
    domains = [d.strip() for d in competitor_domains.split(',')]
    keywords = [k.strip() for k in seed_keywords.split(',')]
    result = finder.identify_keyword_gaps(target_domain, domains, keywords)
    return json.dumps(result, indent=2)


@tool("Extract ranking patterns")
def extract_ranking_patterns_tool(keyword: str) -> str:
    """
    Extract ranking patterns and success factors from top-performing content.
    
    Args:
        keyword: Keyword to analyze top-ranking content for
        
    Returns:
        JSON string with ranking patterns including content structure, length, and key factors
    """
    import json
    extractor = get_pattern_extractor()
    result = extractor.extract_ranking_patterns(keyword)
    return json.dumps(result, indent=2)


@tool("Consensus deep search")
def consensus_deep_search_tool(query: str) -> str:
    """
    Perform a deep search for scientific consensus on a query using Consensus AI.
    
    Args:
        query: Research question or topic to investigate
        
    Returns:
        JSON string with structured summary of literature review, including key findings and consensus meter
    """
    import json
    researcher = get_consensus_researcher()
    result = researcher.deep_search(query)
    return json.dumps(result, indent=2)

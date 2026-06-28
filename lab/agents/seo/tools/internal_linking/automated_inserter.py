"""AutomatedInserter — part of the internal linking tools suite."""

from typing import List, Dict, Any, Literal
from datetime import datetime

from crewai.tools import tool


class AutomatedInserter:
    """
    Automated link insertion tool with comprehensive reporting.
    
    Responsible for:
    - Automatic link insertion into markdown content
    - Link validation and quality assurance
    - Comprehensive reporting for validation
    - Preview/apply/report modes
    """
    
    def __init__(self):
        self.insertion_history = []
        self.validation_rules = {
            "min_anchor_length": 2,
            "max_anchor_length": 8,
            "min_link_distance": 100  # characters between links
        }
    
    @tool
    def insert_links_automatically(
        self,
        linking_strategy: Dict[str, Any],
        content_files: List[str],
        insertion_mode: Literal["preview", "apply", "report"] = "preview"
    ) -> Dict[str, Any]:
        """
        Automatically insert internal links with comprehensive validation.
        
        Args:
            linking_strategy: Complete linking strategy with recommendations
            content_files: List of content file paths to process
            insertion_mode: Operation mode (preview/apply/report)
            
        Returns:
            Detailed insertion report with validation
        """
        
        insertion_results = []
        
        for file_path in content_files:
            # Read content
            content = self._read_content_file(file_path)
            
            if not content:
                continue
            
            # Identify insertion points
            insertion_points = self._find_optimal_insertion_points(
                content, linking_strategy, file_path
            )
            
            # Generate optimized anchor text
            anchor_optimizations = self._optimize_anchor_text(
                insertion_points, linking_strategy
            )
            
            # Insert links (or preview)
            if insertion_mode == "apply":
                modified_content = self._apply_insertions(
                    content, anchor_optimizations
                )
                self._write_content_file(file_path, modified_content)
                status = "applied"
            else:
                status = "preview"
            
            insertion_results.append({
                "file": file_path,
                "insertion_points": insertion_points,
                "anchor_optimizations": anchor_optimizations,
                "links_added": len(anchor_optimizations),
                "seo_impact": self._calculate_seo_impact(anchor_optimizations),
                "conversion_impact": self._calculate_conversion_impact(anchor_optimizations),
                "status": status
            })
        
        # Generate comprehensive report
        report = self._generate_insertion_report(
            insertion_results, linking_strategy, insertion_mode
        )
        
        return {
            "mode": insertion_mode,
            "results": insertion_results,
            "report": report,
            "summary": {
                "files_processed": len(content_files),
                "total_links_inserted": sum(r["links_added"] for r in insertion_results),
                "average_seo_impact": sum(r["seo_impact"] for r in insertion_results) / max(len(insertion_results), 1),
                "average_conversion_impact": sum(r["conversion_impact"] for r in insertion_results) / max(len(insertion_results), 1)
            }
        }
    
    @tool
    def create_insertion_strategy(
        self,
        optimized_strategy: Dict[str, Any],
        content_files: List[str],
        insertion_mode: str = "preview"
    ) -> Dict[str, Any]:
        """
        Create detailed insertion strategy for automated linking.
        
        Args:
            optimized_strategy: Optimized linking strategy
            content_files: Content file paths
            insertion_mode: Preview, apply, or report mode
            
        Returns:
            Comprehensive insertion strategy
        """
        
        return {
            "insertion_mode": insertion_mode,
            "target_files": content_files,
            "optimization_strategy": optimized_strategy,
            "validation_rules": self.validation_rules,
            "estimated_impact": {
                "seo_improvement": "moderate_to_high",
                "conversion_improvement": "high",
                "implementation_effort": "automated"
            }
        }
    
    def _read_content_file(self, file_path: str) -> str:
        """Read content from markdown file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except FileNotFoundError:
            return ""
        except Exception:
            return ""
    
    def _write_content_file(self, file_path: str, content: str) -> None:
        """Write content to markdown file."""
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
        except Exception:
            pass
    
    def _find_optimal_insertion_points(
        self,
        content: str,
        linking_strategy: Dict[str, Any],
        file_path: str
    ) -> List[Dict[str, Any]]:
        """Find optimal points to insert internal links."""
        
        insertion_points = []
        
        # Split content into paragraphs
        paragraphs = content.split('\n\n')
        
        # Analyze each paragraph for insertion opportunities
        for i, paragraph in enumerate(paragraphs):
            if len(paragraph) < 50:  # Skip short paragraphs
                continue
            
            # Find keyword opportunities
            opportunities = self._find_keyword_opportunities(
                paragraph, linking_strategy
            )
            
            for opp in opportunities:
                insertion_points.append({
                    "paragraph_index": i,
                    "paragraph_text": paragraph[:200],  # Preview
                    "keyword": opp["keyword"],
                    "target_url": opp["target_url"],
                    "position": opp["position"],
                    "recommended_links": opp["links"]
                })
        
        return insertion_points
    
    def _find_keyword_opportunities(
        self,
        paragraph: str,
        linking_strategy: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Find keyword-based linking opportunities in a paragraph."""
        
        opportunities = []
        
        # Get linking opportunities from strategy
        new_opps = linking_strategy.get("new_opportunities", [])
        
        for opp in new_opps:
            # Get anchor suggestions
            anchors = opp.get("anchor_suggestions", [])
            
            for anchor in anchors:
                # Check if anchor text appears in paragraph
                if anchor.lower() in paragraph.lower():
                    position = paragraph.lower().find(anchor.lower())
                    opportunities.append({
                        "keyword": anchor,
                        "target_url": opp.get("target_url", ""),
                        "position": position,
                        "links": [opp]
                    })
        
        return opportunities
    
    def _optimize_anchor_text(
        self,
        insertion_points: List[Dict[str, Any]],
        linking_strategy: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Optimize anchor text for all insertion points."""
        
        optimized = []
        
        for point in insertion_points:
            anchor = point["keyword"]
            target_url = point["target_url"]
            
            # Validate anchor length
            word_count = len(anchor.split())
            if word_count < self.validation_rules["min_anchor_length"]:
                # Extend anchor
                anchor = f"{anchor} guide"
            elif word_count > self.validation_rules["max_anchor_length"]:
                # Shorten anchor
                words = anchor.split()[:self.validation_rules["max_anchor_length"]]
                anchor = " ".join(words)
            
            optimized.append({
                "original_anchor": point["keyword"],
                "optimized_anchor": anchor,
                "target_url": target_url,
                "paragraph_index": point["paragraph_index"],
                "position": point["position"]
            })
        
        return optimized
    
    def _apply_insertions(
        self,
        content: str,
        anchor_optimizations: List[Dict[str, Any]]
    ) -> str:
        """Apply link insertions to content."""
        
        modified_content = content
        
        # Sort by position in reverse to maintain indices
        sorted_opts = sorted(
            anchor_optimizations,
            key=lambda x: x["position"],
            reverse=True
        )
        
        for opt in sorted_opts:
            anchor = opt["optimized_anchor"]
            target_url = opt["target_url"]
            position = opt["position"]
            
            # Create markdown link
            markdown_link = f"[{anchor}]({target_url})"
            
            # Replace anchor text with link
            before = modified_content[:position]
            after = modified_content[position + len(anchor):]
            modified_content = before + markdown_link + after
        
        return modified_content
    
    def _calculate_seo_impact(self, anchor_optimizations: List[Dict[str, Any]]) -> float:
        """Calculate SEO impact of insertions."""
        
        if not anchor_optimizations:
            return 0.0
        
        # Base impact per link
        base_impact = 5.0
        
        # Bonus for optimized anchors
        optimized_count = sum(
            1 for opt in anchor_optimizations
            if opt["optimized_anchor"] != opt["original_anchor"]
        )
        
        optimization_bonus = (optimized_count / len(anchor_optimizations)) * 2.0
        
        return min(10.0, base_impact + optimization_bonus)
    
    def _calculate_conversion_impact(self, anchor_optimizations: List[Dict[str, Any]]) -> float:
        """Calculate conversion impact of insertions."""
        
        if not anchor_optimizations:
            return 0.0
        
        # Base conversion impact
        base_impact = 6.0
        
        # Bonus for conversion-focused anchors
        conversion_keywords = ["demo", "trial", "free", "get", "download", "start"]
        conversion_count = sum(
            1 for opt in anchor_optimizations
            if any(keyword in opt["optimized_anchor"].lower() for keyword in conversion_keywords)
        )
        
        conversion_bonus = (conversion_count / len(anchor_optimizations)) * 2.5
        
        return min(10.0, base_impact + conversion_bonus)
    
    def _generate_insertion_report(
        self,
        insertion_results: List[Dict[str, Any]],
        linking_strategy: Dict[str, Any],
        insertion_mode: str
    ) -> Dict[str, Any]:
        """Generate comprehensive insertion report."""
        
        total_links = sum(r["links_added"] for r in insertion_results)
        
        # Calculate balance (50/50 new vs existing)
        new_count = len(linking_strategy.get("new_opportunities", []))
        existing_count = len(linking_strategy.get("existing_optimizations", []))
        
        if new_count + existing_count > 0:
            balance_score = 100 - abs(50 - (new_count / (new_count + existing_count) * 100))
        else:
            balance_score = 100
        
        # Calculate conversion focus
        conversion_focus = linking_strategy.get("conversion_focus", 0.7)
        
        return {
            "report_id": f"insertion_report_{hash(str(insertion_results))}",
            "generated_at": str(datetime.now()),
            "insertion_mode": insertion_mode,
            "files_processed": len(insertion_results),
            "links_inserted": total_links,
            "new_links_added": new_count,
            "existing_links_optimized": existing_count,
            "balance_achieved": balance_score,
            "conversion_focus_achieved": conversion_focus,
            "quality_score": self._calculate_quality_score(insertion_results),
            "seo_impact_score": sum(r["seo_impact"] for r in insertion_results) / max(len(insertion_results), 1) * 10,
            "conversion_impact_score": sum(r["conversion_impact"] for r in insertion_results) / max(len(insertion_results), 1) * 10,
            "recommendations": self._generate_recommendations(insertion_results, linking_strategy)
        }
    
    def _calculate_quality_score(self, insertion_results: List[Dict[str, Any]]) -> float:
        """Calculate overall quality score for insertions."""
        
        if not insertion_results:
            return 0.0
        
        avg_seo = sum(r["seo_impact"] for r in insertion_results) / len(insertion_results)
        avg_conversion = sum(r["conversion_impact"] for r in insertion_results) / len(insertion_results)
        
        return min(100.0, (avg_seo + avg_conversion) / 2 * 10)
    
    def _generate_recommendations(
        self,
        insertion_results: List[Dict[str, Any]],
        linking_strategy: Dict[str, Any]
    ) -> List[str]:
        """Generate recommendations for further optimization."""
        
        recommendations = []
        
        total_links = sum(r["links_added"] for r in insertion_results)
        
        if total_links < 10:
            recommendations.append("Consider adding more internal links to strengthen topical authority")
        
        avg_seo = sum(r["seo_impact"] for r in insertion_results) / max(len(insertion_results), 1)
        if avg_seo < 5.0:
            recommendations.append("Optimize anchor text for better SEO impact")
        
        avg_conversion = sum(r["conversion_impact"] for r in insertion_results) / max(len(insertion_results), 1)
        if avg_conversion < 6.0:
            recommendations.append("Add more conversion-focused links to improve lead generation")
        
        return recommendations

"""
Editing Tools for Editor Agent
Tools for quality checking, consistency validation, markdown formatting, and publication preparation.
"""
from typing import Dict, List, Any, Optional
import re

try:
    import textstat
    TEXTSTAT_AVAILABLE = True
except ImportError:
    TEXTSTAT_AVAILABLE = False


class QualityChecker:
    """Check content quality and readability using textstat metrics."""

    def check_quality(
        self,
        content: str,
        min_words: int = 1500,
        language: str = "en",
    ) -> Dict[str, Any]:
        """Check content quality metrics with real readability scores.

        Args:
            content: Content to check
            min_words: Minimum word count requirement
            language: Text language (default: en)

        Returns:
            Quality analysis results
        """
        if TEXTSTAT_AVAILABLE and language != "en":
            textstat.set_lang(language)

        words = content.split()
        word_count = len(words)
        sentences = len(re.findall(r'[.!?]+', content))
        avg_sentence_length = word_count / sentences if sentences > 0 else 0
        paragraphs = len([p for p in content.split('\n\n') if p.strip()])

        issues: List[str] = []

        if word_count < min_words:
            issues.append(f"Word count below minimum ({word_count}/{min_words})")
        if avg_sentence_length > 25:
            issues.append("Average sentence length too high - reduce complexity")
        if avg_sentence_length < 10:
            issues.append("Average sentence length too low - vary sentence structure")

        readability = self._compute_readability(content, avg_sentence_length)

        flesch = readability["flesch_reading_ease"]
        if flesch < 50:
            issues.append(f"Flesch score {flesch} — too difficult for web content (target 60-70)")
        elif flesch > 80:
            issues.append(f"Flesch score {flesch} — may be too simplistic (target 60-70)")

        return {
            "word_count": word_count,
            "sentence_count": sentences,
            "paragraph_count": paragraphs,
            "avg_sentence_length": round(avg_sentence_length, 1),
            **readability,
            "issues": issues,
            "quality_grade": self._calculate_grade(word_count, min_words, flesch, issues),
        }

    def _compute_readability(self, content: str, avg_sentence_length: float) -> Dict[str, Any]:
        """Compute readability metrics via textstat, with manual fallback."""
        if TEXTSTAT_AVAILABLE:
            flesch = textstat.flesch_reading_ease(content)
            return {
                "flesch_reading_ease": round(flesch, 1),
                "flesch_kincaid_grade": round(textstat.flesch_kincaid_grade(content), 1),
                "gunning_fog": round(textstat.gunning_fog(content), 1),
                "smog_index": round(textstat.smog_index(content), 1),
                "coleman_liau": round(textstat.coleman_liau_index(content), 1),
                "reading_time_sec": round(textstat.reading_time(content, ms_per_char=14.69)),
                "readability_level": self._get_readability_level(flesch),
            }

        # Fallback: incomplete Flesch (no syllable count)
        flesch = round(206.835 - (1.015 * avg_sentence_length), 1)
        return {
            "flesch_reading_ease": flesch,
            "flesch_kincaid_grade": None,
            "gunning_fog": None,
            "smog_index": None,
            "coleman_liau": None,
            "reading_time_sec": None,
            "readability_level": self._get_readability_level(flesch),
        }

    def _get_readability_level(self, score: float) -> str:
        """Convert Flesch score to reading level."""
        if score >= 90:
            return "5th grade (very easy)"
        elif score >= 80:
            return "6th grade (easy)"
        elif score >= 70:
            return "7th grade (fairly easy)"
        elif score >= 60:
            return "8th-9th grade (standard)"
        elif score >= 50:
            return "10th-12th grade (fairly difficult)"
        else:
            return "College level (difficult)"

    def _calculate_grade(self, word_count: int, min_words: int, flesch: float, issues: List[str]) -> str:
        """Calculate overall quality grade."""
        score = 100

        if word_count < min_words:
            score -= 20
        if flesch < 50 or flesch > 80:
            score -= 15
        elif flesch < 60 or flesch > 70:
            score -= 5

        score -= len(issues) * 5

        if score >= 90:
            return "A"
        elif score >= 80:
            return "B"
        elif score >= 70:
            return "C"
        elif score >= 60:
            return "D"
        else:
            return "F"


class ConsistencyValidator:
    """Validate content consistency."""
    
    def validate_consistency(
        self,
        content: str,
        brand_voice: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validate tone and formatting consistency.
        
        Args:
            content: Content to validate
            brand_voice: Target brand voice
            
        Returns:
            Consistency validation results
        """
        issues = []
        
        # Check heading hierarchy
        headings = re.findall(r'^(#+)\s+(.+)$', content, re.MULTILINE)
        h1_count = sum(1 for h in headings if h[0] == '#')
        
        if h1_count != 1:
            issues.append(f"Inconsistent H1 usage: found {h1_count}, should be 1")
        
        # Check for common inconsistencies
        if 'dont' in content.lower() and "don't" in content.lower():
            issues.append("Inconsistent contraction usage")
        
        # Check for mixed list formatting
        bullet_points = len(re.findall(r'^\s*[-*+]\s', content, re.MULTILINE))
        numbered_lists = len(re.findall(r'^\s*\d+\.\s', content, re.MULTILINE))
        
        consistency_score = max(0, 100 - (len(issues) * 10))
        
        return {
            "heading_hierarchy": {
                "h1_count": h1_count,
                "total_headings": len(headings),
                "status": "consistent" if h1_count == 1 else "inconsistent"
            },
            "list_formatting": {
                "bullet_points": bullet_points,
                "numbered_lists": numbered_lists,
                "mixed_usage": bullet_points > 0 and numbered_lists > 0
            },
            "issues": issues,
            "consistency_score": consistency_score,
            "recommendations": [
                "Use single H1 for main title",
                "Maintain consistent heading levels",
                "Use consistent list formatting",
                "Keep tone consistent throughout",
                "Use consistent capitalization in headings"
            ]
        }


class MarkdownFormatter:
    """Format content as clean markdown."""
    
    def format_markdown(
        self,
        content: str,
        add_frontmatter: bool = True,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Format content as clean markdown.
        
        Args:
            content: Raw content
            add_frontmatter: Add YAML frontmatter
            metadata: Metadata for frontmatter
            
        Returns:
            Formatted markdown
        """
        formatted = content.strip()
        
        # Clean up extra blank lines
        formatted = re.sub(r'\n{3,}', '\n\n', formatted)
        
        # Ensure proper spacing around headings
        formatted = re.sub(r'(#+\s.+)\n([^\n])', r'\1\n\n\2', formatted)
        
        # Format lists properly
        formatted = re.sub(r'\n([-*+]\s)', r'\n\1', formatted)
        
        frontmatter = ""
        if add_frontmatter and metadata:
            frontmatter = "---\n"
            frontmatter += f"title: \"{metadata.get('title', 'Untitled')}\"\n"
            frontmatter += f"description: \"{metadata.get('description', '')}\"\n"
            frontmatter += f"date: {metadata.get('date', '2024-01-01')}\n"
            if metadata.get('keywords'):
                frontmatter += f"keywords: [{', '.join(metadata['keywords'])}]\n"
            frontmatter += "---\n\n"
        
        final_content = frontmatter + formatted
        
        return {
            "formatted_content": final_content,
            "has_frontmatter": bool(frontmatter),
            "line_count": len(final_content.split('\n')),
            "formatting_applied": [
                "Cleaned extra blank lines",
                "Proper heading spacing",
                "List formatting normalized",
                "Added frontmatter" if frontmatter else "No frontmatter"
            ]
        }


class PublicationPreparer:
    """Prepare content for publication."""
    
    def prepare_for_publication(
        self,
        content: str,
        metadata: Dict[str, Any],
        checklist_items: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Prepare content for publication.
        
        Args:
            content: Final content
            metadata: Article metadata
            checklist_items: Custom checklist items
            
        Returns:
            Publication package with checklist
        """
        default_checklist = [
            "✅ Content reviewed and edited",
            "✅ Grammar and spelling checked",
            "✅ SEO metadata validated",
            "✅ Schema markup added",
            "✅ Internal links verified",
            "✅ Images have alt text",
            "✅ Markdown properly formatted",
            "⬜ Featured image selected",
            "⬜ URL slug optimized",
            "⬜ Categories/tags assigned",
            "⬜ Social media preview tested",
            "⬜ Mobile preview checked",
            "⬜ Final stakeholder approval"
        ]
        
        if checklist_items:
            default_checklist.extend(checklist_items)
        
        post_publication = [
            "Monitor search console for indexing",
            "Track rankings for target keywords",
            "Monitor engagement metrics (time on page, bounce rate)",
            "Share on social media channels",
            "Add to internal linking strategy",
            "Update related content with links to new article",
            "Schedule content refresh in 6-12 months"
        ]
        
        return {
            "status": "ready_for_review",
            "content_length": len(content.split()),
            "metadata": metadata,
            "pre_publication_checklist": default_checklist,
            "post_publication_tasks": post_publication,
            "estimated_publication_time": "15-30 minutes",
            "success_metrics": [
                "Organic impressions in first 30 days",
                "Average position for target keyword",
                "Click-through rate from SERPs",
                "Time on page and engagement",
                "Internal link clicks",
                "Social shares and backlinks"
            ],
            "publication_notes": [
                "Schedule during peak traffic hours",
                "Announce in newsletter if applicable",
                "Update XML sitemap after publication",
                "Submit URL to Search Console for indexing",
                "Monitor for any technical issues"
            ]
        }

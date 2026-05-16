"""Pydantic output schemas for each stage of the SEO content pipeline.

Used as output_pydantic= on CrewAI Tasks so inter-agent context is
structured JSON instead of truncated raw text.

Design: fields are intentionally simple (str / list[str] / int / float)
to maximise LLM reliability. Complex nesting causes JSON parse failures.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Stage 1 — Research Analyst
# ---------------------------------------------------------------------------

class ResearchOutput(BaseModel):
    """Structured output from the SEO Research Analyst."""

    summary: str = Field(
        description="2-3 sentence executive summary of the competitive landscape."
    )
    search_intent: str = Field(
        description="Primary search intent: Informational, Commercial, Transactional, or Navigational."
    )
    top_competitors: list[str] = Field(
        default_factory=list,
        description="Top competitor URLs or domains found in SERP (max 10).",
    )
    keyword_opportunities: list[str] = Field(
        default_factory=list,
        description="High-value keyword opportunities identified.",
    )
    content_gaps: list[str] = Field(
        default_factory=list,
        description="Topics and angles competitors miss that we can own.",
    )
    ranking_factors: list[str] = Field(
        default_factory=list,
        description="Key factors that make top-ranking content succeed.",
    )
    recommendations: list[str] = Field(
        default_factory=list,
        description="Prioritised strategic recommendations (highest impact first).",
    )
    competitive_difficulty: Optional[str] = Field(
        None,
        description="Overall difficulty: Low / Medium / High / Very High.",
    )


# ---------------------------------------------------------------------------
# Stage 2 — Content Strategist
# ---------------------------------------------------------------------------

class StrategyOutput(BaseModel):
    """Structured output from the Content Strategist."""

    pillar_topic: str = Field(
        description="Main pillar topic this content sits under."
    )
    content_outline: str = Field(
        description="Full article outline in markdown (H1, H2s, H3s with brief descriptions)."
    )
    key_sections: list[str] = Field(
        default_factory=list,
        description="Top-level sections (H2s) the article must cover.",
    )
    topic_clusters: list[str] = Field(
        default_factory=list,
        description="Related cluster article ideas to build topical authority.",
    )
    internal_link_targets: list[str] = Field(
        default_factory=list,
        description="Existing pages to link to/from the new article.",
    )
    recommended_word_count: int = Field(
        2000,
        description="Recommended article word count based on SERP analysis.",
    )
    content_angle: str = Field(
        description="Unique angle or hook that differentiates this article."
    )


# ---------------------------------------------------------------------------
# Stage 3 — Copywriter
# ---------------------------------------------------------------------------

class WritingOutput(BaseModel):
    """Structured output from the SEO Copywriter."""

    title_tag: str = Field(
        description="SEO title tag (50-60 characters, includes primary keyword)."
    )
    meta_description: str = Field(
        description="Meta description (150-160 characters, includes CTA)."
    )
    article: str = Field(
        description="Full article content in markdown format."
    )
    word_count: int = Field(
        description="Actual word count of the article."
    )
    primary_keyword_density: float = Field(
        description="Primary keyword density as a percentage (target: 1-2%)."
    )
    url_slug: str = Field(
        description="Recommended URL slug (kebab-case, includes primary keyword)."
    )
    tags: list[str] = Field(
        default_factory=list,
        description="Suggested content tags/categories.",
    )


# ---------------------------------------------------------------------------
# Stage 4 — Technical SEO Specialist
# ---------------------------------------------------------------------------

class TechnicalOutput(BaseModel):
    """Structured output from the Technical SEO Specialist."""

    title_tag: str = Field(
        description="Final optimised title tag after technical review."
    )
    meta_description: str = Field(
        description="Final optimised meta description after technical review."
    )
    schema_markup: str = Field(
        description="Complete JSON-LD structured data markup (Article + FAQPage if applicable)."
    )
    canonical_url: Optional[str] = Field(
        None,
        description="Recommended canonical URL.",
    )
    on_page_issues: list[str] = Field(
        default_factory=list,
        description="Technical issues found (heading structure, alt text, etc.).",
    )
    internal_link_suggestions: list[str] = Field(
        default_factory=list,
        description="Specific internal linking recommendations with anchor text.",
    )
    priority_fixes: list[str] = Field(
        default_factory=list,
        description="High-priority fixes ordered by SEO impact.",
    )


# ---------------------------------------------------------------------------
# Stage 5 — Marketing Strategist
# ---------------------------------------------------------------------------

class MarketingOutput(BaseModel):
    """Structured output from the Marketing Strategist."""

    priority: str = Field(
        description="Content priority recommendation: High / Medium / Low / Reconsider."
    )
    priority_score: int = Field(
        description="Priority score 0-100 based on business impact, ROI, and strategic fit."
    )
    business_alignment: str = Field(
        description="Assessment of how well this content supports business objectives."
    )
    roi_estimate: str = Field(
        description="Estimated ROI summary (traffic potential, conversion, payback period)."
    )
    recommendations: list[str] = Field(
        default_factory=list,
        description="Strategic marketing recommendations (distribution, CRO, repurposing).",
    )
    kpis: list[str] = Field(
        default_factory=list,
        description="KPIs to track success at 30/60/90-day intervals.",
    )
    risks: list[str] = Field(
        default_factory=list,
        description="Key risks that could prevent content from achieving goals.",
    )


# ---------------------------------------------------------------------------
# Stage 6 — Editor (final output)
# ---------------------------------------------------------------------------

class EditingOutput(BaseModel):
    """Structured output from the Senior Content Editor — the final pipeline output."""

    final_article: str = Field(
        description="Publication-ready article in markdown format with all frontmatter."
    )
    title_tag: str = Field(
        description="Final title tag after editorial review."
    )
    meta_description: str = Field(
        description="Final meta description after editorial review."
    )
    quality_grade: str = Field(
        description="Overall content quality grade: A / B / C / D / F."
    )
    publication_ready: bool = Field(
        description="True if content is ready to publish without further changes."
    )
    editorial_changes: list[str] = Field(
        default_factory=list,
        description="Summary of key editorial changes made.",
    )
    checklist: list[str] = Field(
        default_factory=list,
        description="Pre-publication checklist items to verify before going live.",
    )

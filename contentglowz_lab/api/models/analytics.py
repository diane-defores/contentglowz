"""Pydantic models for the cookie-free analytics system."""

from __future__ import annotations

from pydantic import BaseModel, Field


# ── Collect (public endpoint) ────────────────────


class CollectPayload(BaseModel):
    """Pageview beacon sent by the tracking script.

    Field names are short to minimise payload size.
    """

    d: str = Field(..., max_length=253, description="Domain (hostname)")
    p: str = Field(..., max_length=2048, description="Path")
    r: str | None = Field(None, max_length=2048, description="Referrer URL")
    us: str | None = Field(None, max_length=200, description="utm_source")
    um: str | None = Field(None, max_length=200, description="utm_medium")
    uc: str | None = Field(None, max_length=200, description="utm_campaign")


# ── Query responses (authenticated endpoints) ───


class AnalyticsSummary(BaseModel):
    totalViews: int
    uniquePages: int
    topPage: str | None = None
    topReferrer: str | None = None
    period: str
    domains: list[str]


class PageStats(BaseModel):
    path: str
    views: int


class ReferrerStats(BaseModel):
    referrer: str
    views: int


class TimeseriesPoint(BaseModel):
    date: str  # "2026-03-29"
    views: int

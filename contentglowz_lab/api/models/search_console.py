from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class SearchConsoleModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class SearchConsoleOAuthStartResponse(SearchConsoleModel):
    authorize_url: str = Field(serialization_alias="authorizeUrl")
    state: str
    expires_at: datetime | None = Field(default=None, serialization_alias="expiresAt")


class SearchConsoleOAuthCallbackResponse(SearchConsoleModel):
    project_id: str | None = Field(default=None, serialization_alias="projectId")
    connected: bool
    status: str
    source_label: str = Field(default="Google Search Console", serialization_alias="sourceLabel")
    property_url: str | None = Field(default=None, serialization_alias="propertyUrl")
    message: str | None = None


class SearchConsoleConnectionStatus(SearchConsoleModel):
    project_id: str = Field(serialization_alias="projectId")
    connected: bool
    status: str
    source: str = Field(default="search_console")
    source_label: str = Field(default="Google Search", serialization_alias="sourceLabel")
    property_url: str | None = Field(default=None, serialization_alias="propertyUrl")
    property_label: str | None = Field(default=None, serialization_alias="propertyLabel")
    account_email: str | None = Field(default=None, serialization_alias="accountEmail")
    scopes: list[str] = Field(default_factory=list)
    validation_status: str = Field(default="unknown", serialization_alias="validationStatus")
    connected_at: datetime | None = Field(default=None, serialization_alias="connectedAt")
    synced_at: datetime | None = Field(default=None, serialization_alias="syncedAt")
    last_sync_status: str | None = Field(default=None, serialization_alias="lastSyncStatus")
    last_sync_message: str | None = Field(default=None, serialization_alias="lastSyncMessage")
    token_expires_at: datetime | None = Field(default=None, serialization_alias="tokenExpiresAt")


class SearchConsolePropertyRequest(SearchConsoleModel):
    project_id: str = Field(validation_alias="projectId", serialization_alias="projectId")
    property_url: str = Field(validation_alias="propertyUrl", serialization_alias="propertyUrl")


class SearchConsoleProperty(SearchConsoleModel):
    site_url: str = Field(serialization_alias="siteUrl")
    permission_level: str | None = Field(default=None, serialization_alias="permissionLevel")
    display_name: str | None = Field(default=None, serialization_alias="displayName")
    matches_project_domain: bool = Field(default=False, serialization_alias="matchesProjectDomain")


class SearchConsolePropertyListResponse(SearchConsoleModel):
    project_id: str = Field(serialization_alias="projectId")
    items: list[SearchConsoleProperty] = Field(default_factory=list)
    source: str = "search_console"
    source_label: str = Field(default="Google Search Console", serialization_alias="sourceLabel")


class SearchConsoleSummaryMetric(SearchConsoleModel):
    label: str
    value: str | int | float


class SearchConsoleTopRow(SearchConsoleModel):
    key: str
    clicks: int
    impressions: int
    ctr: float
    position: float | None = None
    url: str | None = None
    query: str | None = None
    period: str | None = None
    evidence: dict[str, Any] | None = None


class SearchConsoleSourceSection(SearchConsoleModel):
    source: str
    source_label: str = Field(default="Google Search", serialization_alias="sourceLabel")
    period: str
    is_partial: bool = Field(default=False, serialization_alias="isPartial")
    stale: bool = False
    synced_at: datetime | None = Field(default=None, serialization_alias="syncedAt")
    summary: str
    metrics: dict[str, Any] = Field(default_factory=dict)
    top_pages: list[SearchConsoleTopRow] = Field(default_factory=list, serialization_alias="topPages")
    top_queries: list[SearchConsoleTopRow] = Field(default_factory=list, serialization_alias="topQueries")
    issues: list[dict[str, Any]] = Field(default_factory=list)


class SearchConsoleSiteTrafficSection(SearchConsoleModel):
    source: str
    source_label: str = Field(serialization_alias="sourceLabel")
    period: str
    is_partial: bool = Field(default=False, serialization_alias="isPartial")
    stale: bool = False
    synced_at: datetime | None = Field(default=None, serialization_alias="syncedAt")
    metrics: dict[str, Any] = Field(default_factory=dict)
    top_pages: list[dict[str, Any]] = Field(default_factory=list, serialization_alias="topPages")
    message: str | None = None


class SearchConsoleSummaryResponse(SearchConsoleModel):
    project_id: str = Field(serialization_alias="projectId")
    period: str
    period_name: str = Field(default="", serialization_alias="periodName")
    google_search: SearchConsoleSourceSection = Field(serialization_alias="googleSearch")
    site_traffic: SearchConsoleSiteTrafficSection = Field(serialization_alias="siteTraffic")
    overview: str
    opportunities_count: int = Field(default=0, serialization_alias="opportunitiesCount")
    errors: list[str] = Field(default_factory=list)


class SearchConsoleOpportunity(SearchConsoleModel):
    reason: str
    period: str
    title: str
    confidence: float = 0.5
    priority_score: float = Field(default=0, serialization_alias="priorityScore")
    target_query: str | None = Field(default=None, serialization_alias="targetQuery")
    target_url: str | None = Field(default=None, serialization_alias="targetUrl")
    summary: str
    evidence: dict[str, Any]
    source: str = Field(default="search_console_feedback")
    source_label: str = Field(default="Search Console Feedback", serialization_alias="sourceLabel")


class SearchConsoleOpportunityResponse(SearchConsoleModel):
    project_id: str = Field(serialization_alias="projectId")
    period: str
    items: list[SearchConsoleOpportunity] = Field(default_factory=list)
    source: str
    source_label: str = Field(default="Google Search Console", serialization_alias="sourceLabel")


class SearchConsoleIngestOpportunityItem(SearchConsoleModel):
    reason: str
    period: str
    title: str
    priority_score: float = Field(default=0, alias="priorityScore")
    target_query: str | None = Field(default=None, alias="targetQuery")
    target_url: str | None = Field(default=None, alias="targetUrl")
    summary: str
    evidence: dict[str, Any]


class SearchConsoleIngestRequest(SearchConsoleModel):
    project_id: str = Field(validation_alias="projectId", serialization_alias="projectId")
    opportunities: list[SearchConsoleIngestOpportunityItem]


class SearchConsoleIngestResponse(SearchConsoleModel):
    project_id: str = Field(serialization_alias="projectId")
    ingested: int
    skipped: int = 0

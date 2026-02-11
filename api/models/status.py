"""Request/Response models for status management endpoints."""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime


class CreateContentRequest(BaseModel):
    """Request to create a new content record."""
    title: str = Field(..., description="Content title")
    content_type: str = Field(..., description="Type of content (article, newsletter, seo-content, manual, image)")
    source_robot: str = Field(..., description="Robot that created this (seo, newsletter, article, manual, images)")
    status: str = Field(default="todo", description="Initial status")
    project_id: Optional[str] = Field(None, description="Associated project ID")
    content_path: Optional[str] = Field(None, description="File system path")
    content_preview: Optional[str] = Field(None, description="Short preview text")
    priority: int = Field(default=3, ge=1, le=5, description="Priority 1-5")
    tags: List[str] = Field(default_factory=list, description="Content tags")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    target_url: Optional[str] = Field(None, description="Target URL after publishing")


class UpdateContentRequest(BaseModel):
    """Request to update a content record (not status - use transition)."""
    title: Optional[str] = None
    content_path: Optional[str] = None
    content_preview: Optional[str] = None
    priority: Optional[int] = Field(None, ge=1, le=5)
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    target_url: Optional[str] = None
    project_id: Optional[str] = None
    reviewer_note: Optional[str] = None
    reviewed_by: Optional[str] = None


class TransitionRequest(BaseModel):
    """Request to transition content to a new status."""
    to_status: str = Field(..., description="Target status")
    changed_by: str = Field(..., description="Who is making the change")
    reason: Optional[str] = Field(None, description="Reason for the transition")


class ContentResponse(BaseModel):
    """Response representing a content record."""
    id: str
    title: str
    content_type: str
    source_robot: str
    status: str
    project_id: Optional[str]
    content_path: Optional[str]
    content_preview: Optional[str]
    content_hash: Optional[str]
    priority: int
    tags: List[str]
    metadata: Dict[str, Any]
    target_url: Optional[str]
    reviewer_note: Optional[str]
    reviewed_by: Optional[str]
    created_at: datetime
    updated_at: datetime
    scheduled_for: Optional[datetime]
    published_at: Optional[datetime]
    synced_at: Optional[datetime]


class StatusChangeResponse(BaseModel):
    """Response representing a status change in the audit trail."""
    id: str
    content_id: str
    from_status: str
    to_status: str
    changed_by: str
    reason: Optional[str]
    timestamp: datetime


class StatsResponse(BaseModel):
    """Response with content statistics."""
    total: int
    by_status: Dict[str, int]


class ContentListResponse(BaseModel):
    """Response with a list of content records."""
    items: List[ContentResponse]
    total: int


class WorkDomainResponse(BaseModel):
    """Response representing a work domain state."""
    id: str
    project_id: str
    domain: str
    status: str
    last_run_at: Optional[datetime]
    last_run_status: Optional[str]
    items_pending: int
    items_completed: int
    metadata: Dict[str, Any]
    updated_at: datetime


class UpdateDomainRequest(BaseModel):
    """Request to update a work domain."""
    status: Optional[str] = None
    last_run_status: Optional[str] = None
    items_pending: Optional[int] = None
    items_completed: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

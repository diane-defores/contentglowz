"""Models for reel render jobs and artifacts."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


RenderMode = Literal["preview", "final"]
ReelRenderStatus = Literal["queued", "in_progress", "completed", "failed", "cancelled"]


class ReelRenderJobCreateRequest(BaseModel):
    content_id: str = Field(..., min_length=1)
    template_id: str = Field(default="content-summary-v1")
    duration_seconds: int = Field(default=60)
    client_request_id: str | None = Field(default=None, max_length=128)


class ReelRenderExportRequest(BaseModel):
    client_request_id: str | None = Field(default=None, max_length=128)


class ReelRenderArtifact(BaseModel):
    artifact_url: str
    artifact_expires_at: datetime
    retention_expires_at: datetime
    deletion_warning_at: datetime
    byte_size: int
    mime_type: str
    render_mode: RenderMode
    file_name: str


class ReelRenderJobResponse(BaseModel):
    job_id: str
    job_type: str
    status: ReelRenderStatus
    progress: int
    message: str | None = None
    content_id: str
    project_id: str
    template_id: str
    render_mode: RenderMode
    duration_seconds: int
    parent_preview_job_id: str | None = None
    worker_job_id: str | None = None
    artifact: ReelRenderArtifact | None = None
    created_at: datetime
    updated_at: datetime


class ReelRenderCancelResponse(BaseModel):
    job_id: str
    status: ReelRenderStatus
    message: str | None = None

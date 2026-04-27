"""Models for work domain endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class WorkDomainResponse(BaseModel):
    id: str
    userId: str
    projectId: str
    domain: str
    status: str = "idle"
    lastRunAt: datetime | None = None
    lastRunStatus: str | None = None
    itemsPending: int = 0
    itemsCompleted: int = 0
    metadata: dict[str, Any] | None = None
    updatedAt: datetime


class WorkDomainCreateRequest(BaseModel):
    projectId: str
    domain: str
    status: str | None = None
    metadata: dict[str, Any] | None = None


class WorkDomainUpdateRequest(BaseModel):
    status: str | None = None
    lastRunStatus: str | None = None
    itemsPending: int | None = None
    itemsCompleted: int | None = None
    metadata: dict[str, Any] | None = None

"""Models for affiliate link endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class AffiliateLinkResponse(BaseModel):
    id: str
    userId: str
    projectId: str | None = None
    name: str
    url: str
    description: str | None = None
    contactUrl: str | None = None
    loginUrl: str | None = None
    researchSummary: str | None = None
    researchedAt: datetime | None = None
    category: str | None = None
    commission: str | None = None
    keywords: list[str] = Field(default_factory=list)
    status: str = "active"
    notes: str | None = None
    expiresAt: datetime | None = None
    createdAt: datetime
    updatedAt: datetime


class AffiliateLinkCreateRequest(BaseModel):
    projectId: str | None = None
    name: str
    url: str
    description: str | None = None
    contactUrl: str | None = None
    loginUrl: str | None = None
    category: str | None = None
    commission: str | None = None
    keywords: list[str] | None = None
    status: str | None = None
    notes: str | None = None
    expiresAt: str | None = None


class AffiliateLinkUpdateRequest(BaseModel):
    name: str | None = None
    url: str | None = None
    description: str | None = None
    contactUrl: str | None = None
    loginUrl: str | None = None
    category: str | None = None
    commission: str | None = None
    keywords: list[str] | None = None
    status: str | None = None
    notes: str | None = None
    expiresAt: str | None = None

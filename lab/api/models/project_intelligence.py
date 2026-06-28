from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


def _to_camel(value: str) -> str:
    parts = value.split("_")
    if not parts:
        return value
    return parts[0] + "".join(part.capitalize() for part in parts[1:])


class ProjectIntelligenceModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=_to_camel,
    )


FactCategory = Literal[
    "audience",
    "offer",
    "positioning",
    "channel",
    "seo",
    "competitor",
    "constraint",
    "content_asset",
    "risk",
    "open_question",
]


class ProjectIntelligenceEvidenceRef(ProjectIntelligenceModel):
    source_id: str = Field(serialization_alias="sourceId")
    document_id: str | None = Field(default=None, serialization_alias="documentId")
    chunk_id: str | None = Field(default=None, serialization_alias="chunkId")
    snippet: str | None = None


class ProjectIntelligenceJob(ProjectIntelligenceModel):
    id: str
    user_id: str = Field(serialization_alias="userId")
    project_id: str = Field(serialization_alias="projectId")
    job_type: str = Field(serialization_alias="jobType")
    status: str
    summary: dict[str, Any] = Field(default_factory=dict)
    error_code: str | None = Field(default=None, serialization_alias="errorCode")
    error_message: str | None = Field(default=None, serialization_alias="errorMessage")
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")
    started_at: datetime | None = Field(default=None, serialization_alias="startedAt")
    completed_at: datetime | None = Field(default=None, serialization_alias="completedAt")


class ProjectIntelligenceSource(ProjectIntelligenceModel):
    id: str
    user_id: str = Field(serialization_alias="userId")
    project_id: str = Field(serialization_alias="projectId")
    source_type: str = Field(serialization_alias="sourceType")
    source_label: str = Field(serialization_alias="sourceLabel")
    status: str
    origin_ref: str | None = Field(default=None, serialization_alias="originRef")
    content_hash: str | None = Field(default=None, serialization_alias="contentHash")
    summary_text: str | None = Field(default=None, serialization_alias="summaryText")
    metadata: dict[str, Any] = Field(default_factory=dict)
    removed_at: datetime | None = Field(default=None, serialization_alias="removedAt")
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")


class ProjectIntelligenceDocument(ProjectIntelligenceModel):
    id: str
    source_id: str = Field(serialization_alias="sourceId")
    user_id: str = Field(serialization_alias="userId")
    project_id: str = Field(serialization_alias="projectId")
    title: str
    mime_type: str | None = Field(default=None, serialization_alias="mimeType")
    file_name: str | None = Field(default=None, serialization_alias="fileName")
    content_hash: str = Field(serialization_alias="contentHash")
    normalized_hash: str = Field(serialization_alias="normalizedHash")
    snippet: str | None = None
    char_count: int = Field(default=0, serialization_alias="charCount")
    is_duplicate: bool = Field(default=False, serialization_alias="isDuplicate")
    canonical_document_id: str | None = Field(default=None, serialization_alias="canonicalDocumentId")
    near_duplicate_score: float | None = Field(default=None, serialization_alias="nearDuplicateScore")
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")


class ProjectIntelligenceChunk(ProjectIntelligenceModel):
    id: str
    document_id: str = Field(serialization_alias="documentId")
    source_id: str = Field(serialization_alias="sourceId")
    user_id: str = Field(serialization_alias="userId")
    project_id: str = Field(serialization_alias="projectId")
    order_index: int = Field(serialization_alias="orderIndex")
    start_offset: int = Field(serialization_alias="startOffset")
    end_offset: int = Field(serialization_alias="endOffset")
    text: str
    content_hash: str = Field(serialization_alias="contentHash")
    created_at: datetime = Field(serialization_alias="createdAt")


class ProjectIntelligenceFact(ProjectIntelligenceModel):
    id: str
    source_id: str = Field(serialization_alias="sourceId")
    document_id: str = Field(serialization_alias="documentId")
    chunk_id: str | None = Field(default=None, serialization_alias="chunkId")
    user_id: str = Field(serialization_alias="userId")
    project_id: str = Field(serialization_alias="projectId")
    category: FactCategory
    subject: str
    statement: str
    confidence: float = 0.0
    priority: int = 3
    evidence_snippet: str | None = Field(default=None, serialization_alias="evidenceSnippet")
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")


class ProjectIntelligenceDuplicate(ProjectIntelligenceModel):
    id: str
    user_id: str = Field(serialization_alias="userId")
    project_id: str = Field(serialization_alias="projectId")
    document_id: str = Field(serialization_alias="documentId")
    canonical_document_id: str = Field(serialization_alias="canonicalDocumentId")
    kind: str
    similarity: float = 1.0
    reason: str
    created_at: datetime = Field(serialization_alias="createdAt")


class ProjectIntelligenceRecommendation(ProjectIntelligenceModel):
    id: str
    user_id: str = Field(serialization_alias="userId")
    project_id: str = Field(serialization_alias="projectId")
    recommendation_key: str = Field(serialization_alias="recommendationKey")
    recommendation_type: str = Field(serialization_alias="recommendationType")
    title: str
    summary: str
    rationale: str | None = None
    priority: int = 3
    confidence: float = 0.0
    status: str = "open"
    evidence_ids: list[str] = Field(default_factory=list, serialization_alias="evidenceIds")
    evidence: list[ProjectIntelligenceEvidenceRef] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")


class ProjectIntelligenceStatusResponse(ProjectIntelligenceModel):
    project_id: str = Field(serialization_alias="projectId")
    counts: dict[str, int] = Field(default_factory=dict)
    active_job: ProjectIntelligenceJob | None = Field(default=None, serialization_alias="activeJob")
    last_job: ProjectIntelligenceJob | None = Field(default=None, serialization_alias="lastJob")
    degraded: bool = False
    degraded_reason: str | None = Field(default=None, serialization_alias="degradedReason")


class ProjectIntelligenceUploadResult(ProjectIntelligenceModel):
    project_id: str = Field(serialization_alias="projectId")
    job: ProjectIntelligenceJob
    accepted: int = 0
    failed: int = 0
    duplicated: int = 0
    errors: list[dict[str, Any]] = Field(default_factory=list)


class ProjectIntelligenceSyncRequest(ProjectIntelligenceModel):
    connectors: list[str] = Field(default_factory=list)
    include_ai_synthesis: bool = Field(
        default=False,
        validation_alias="includeAiSynthesis",
        serialization_alias="includeAiSynthesis",
    )


class ProjectIntelligenceProviderReadiness(ProjectIntelligenceModel):
    project_id: str = Field(serialization_alias="projectId")
    readiness: str
    score: int
    rationale: str
    recommended_next_step: str = Field(serialization_alias="recommendedNextStep")
    warnings: list[str] = Field(default_factory=list)


class ProjectIntelligenceAddToIdeaPoolResponse(ProjectIntelligenceModel):
    project_id: str = Field(serialization_alias="projectId")
    recommendation_id: str = Field(serialization_alias="recommendationId")
    action: Literal["created", "reused", "skipped"]
    idea_id: str | None = Field(default=None, serialization_alias="ideaId")
    message: str


class ProjectIntelligenceSourceListResponse(ProjectIntelligenceModel):
    items: list[ProjectIntelligenceSource] = Field(default_factory=list)
    total: int = 0


class ProjectIntelligenceDocumentListResponse(ProjectIntelligenceModel):
    items: list[ProjectIntelligenceDocument] = Field(default_factory=list)
    total: int = 0


class ProjectIntelligenceFactListResponse(ProjectIntelligenceModel):
    items: list[ProjectIntelligenceFact] = Field(default_factory=list)
    total: int = 0


class ProjectIntelligenceRecommendationListResponse(ProjectIntelligenceModel):
    items: list[ProjectIntelligenceRecommendation] = Field(default_factory=list)
    total: int = 0


class ProjectIntelligenceJobListResponse(ProjectIntelligenceModel):
    items: list[ProjectIntelligenceJob] = Field(default_factory=list)
    total: int = 0

"""Public contracts for project-scoped multimodal video source intake.

The API deliberately exposes domain identifiers and short-lived upload/delivery
instructions only. Provider configuration and durable storage locators remain
server-side.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, HttpUrl, field_validator


class StrictRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class SourceType(str, Enum):
    BINARY_VIDEO = "binary_video"
    BINARY_IMAGE = "binary_image"
    BINARY_AUDIO = "binary_audio"
    PUBLIC_LINK = "public_link"
    PASTED_TEXT = "pasted_text"


class SourceStatus(str, Enum):
    PENDING_VALIDATION = "pending_validation"
    PROCESSING = "processing"
    READY = "ready"
    METADATA_UNAVAILABLE = "metadata_unavailable"
    FAILED = "failed"
    REPLACEMENT_PENDING = "replacement_pending"
    SUPERSEDED = "superseded"
    REMOVED = "removed"
    ORPHAN_CLEANUP_NEEDED = "orphan_cleanup_needed"


class FolderStatus(str, Enum):
    COLLECTING = "collecting"
    READY = "ready"
    CHANGED_AFTER_READY = "changed_after_ready"
    ARCHIVED = "archived"


class EnqueueStatus(str, Enum):
    NOT_REQUESTED = "not_requested"
    ENQUEUE_PENDING = "enqueue_pending"
    ENQUEUED = "enqueued"
    ENQUEUE_FAILED = "enqueue_failed"


class OpenVideoSourceFolderRequest(StrictRequest):
    project_id: str = Field(
        ..., min_length=1, max_length=128,
        validation_alias=AliasChoices("projectId", "project_id"),
        serialization_alias="projectId",
    )
    content_id: str = Field(
        ..., min_length=1, max_length=128,
        validation_alias=AliasChoices("contentId", "content_id"),
        serialization_alias="contentId",
    )


class AddTextRequest(StrictRequest):
    text: str = Field(..., min_length=1, max_length=100_000)
    idempotency_key: str = Field(
        ..., min_length=1, max_length=128,
        validation_alias=AliasChoices("idempotencyKey", "idempotency_key"),
        serialization_alias="idempotencyKey",
    )
    expected_revision: int = Field(
        ..., ge=0,
        validation_alias=AliasChoices("expectedRevision", "expected_revision"),
        serialization_alias="expectedRevision",
    )


class AddLinkRequest(StrictRequest):
    url: HttpUrl = Field(..., max_length=2048)
    idempotency_key: str = Field(
        ..., min_length=1, max_length=128,
        validation_alias=AliasChoices("idempotencyKey", "idempotency_key"),
        serialization_alias="idempotencyKey",
    )
    expected_revision: int = Field(
        ..., ge=0,
        validation_alias=AliasChoices("expectedRevision", "expected_revision"),
        serialization_alias="expectedRevision",
    )


class CreateUploadSessionRequest(StrictRequest):
    source_type: Literal["binary_video", "binary_image", "binary_audio"] = Field(
        ...,
        validation_alias=AliasChoices("sourceType", "source_type"),
        serialization_alias="sourceType",
    )
    file_name: str = Field(
        ..., min_length=1, max_length=255,
        validation_alias=AliasChoices("fileName", "file_name"),
        serialization_alias="fileName",
    )
    mime_type: str = Field(
        ..., min_length=1, max_length=128,
        validation_alias=AliasChoices("mimeType", "mime_type"),
        serialization_alias="mimeType",
    )
    byte_size: int = Field(
        ..., gt=0, le=200 * 1024 * 1024,
        validation_alias=AliasChoices("byteSize", "byte_size"),
        serialization_alias="byteSize",
    )
    checksum_sha256: str = Field(
        ..., pattern=r"^[a-fA-F0-9]{64}$",
        validation_alias=AliasChoices("checksumSha256", "checksum_sha256"),
        serialization_alias="checksumSha256",
    )
    expected_revision: int = Field(
        ..., ge=0,
        validation_alias=AliasChoices("expectedRevision", "expected_revision"),
        serialization_alias="expectedRevision",
    )
    idempotency_key: str = Field(
        ..., min_length=1, max_length=128,
        validation_alias=AliasChoices("idempotencyKey", "idempotency_key"),
        serialization_alias="idempotencyKey",
    )
    replace_source_id: str | None = Field(
        default=None, min_length=1, max_length=128,
        validation_alias=AliasChoices("replaceSourceId", "replace_source_id"),
        serialization_alias="replaceSourceId",
    )

    @field_validator("file_name")
    @classmethod
    def clean_file_name(cls, value: str) -> str:
        cleaned = value.strip().replace("\\", "_").replace("/", "_")
        if cleaned in {"", ".", ".."}:
            raise ValueError("Invalid file name")
        return cleaned


class UploadedPartRequest(StrictRequest):
    part_number: int = Field(
        ..., ge=1, le=10_000,
        validation_alias=AliasChoices("partNumber", "part_number"),
        serialization_alias="partNumber",
    )
    etag: str = Field(..., min_length=1, max_length=256)
    checksum_sha256: str = Field(
        ...,
        pattern=r"^[a-fA-F0-9]{64}$",
        validation_alias=AliasChoices("checksumSha256", "checksum_sha256"),
        serialization_alias="checksumSha256",
    )
    size_bytes: int = Field(
        ..., gt=0, le=64 * 1024 * 1024,
        validation_alias=AliasChoices("sizeBytes", "size_bytes"),
        serialization_alias="sizeBytes",
    )


class CompleteUploadSessionRequest(StrictRequest):
    parts: list[UploadedPartRequest] = Field(default_factory=list, max_length=10_000)


class SignUploadPartRequest(StrictRequest):
    part_number: int = Field(
        ..., ge=1, le=10_000,
        validation_alias=AliasChoices("partNumber", "part_number"),
        serialization_alias="partNumber",
    )
    checksum_sha256: str = Field(
        ..., pattern=r"^[a-fA-F0-9]{64}$",
        validation_alias=AliasChoices("checksumSha256", "checksum_sha256"),
        serialization_alias="checksumSha256",
    )
    size_bytes: int = Field(
        ..., gt=0, le=64 * 1024 * 1024,
        validation_alias=AliasChoices("sizeBytes", "size_bytes"),
        serialization_alias="sizeBytes",
    )


class MutationRequest(StrictRequest):
    revision: int = Field(
        ..., ge=0,
        validation_alias=AliasChoices("revision", "expectedRevision", "expected_revision"),
        serialization_alias="revision",
    )


class ReplaceSourceRequest(CreateUploadSessionRequest):
    pass


class MarkSourcesReadyRequest(MutationRequest):
    pass


class GenerateVideoRequest(MutationRequest):
    idempotency_key: str = Field(
        ..., min_length=1, max_length=128,
        validation_alias=AliasChoices("idempotencyKey", "idempotency_key"),
        serialization_alias="idempotencyKey",
    )


class SourceErrorResponse(BaseModel):
    code: str
    message: str
    retryable: bool = False


class VideoSourceResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    folder_id: str = Field(serialization_alias="folderId")
    source_type: SourceType = Field(serialization_alias="sourceType")
    status: SourceStatus
    asset_id: str | None = Field(default=None, serialization_alias="assetId")
    display_name: str = Field(default="Source", serialization_alias="displayName")
    text_preview: str | None = Field(default=None, serialization_alias="textPreview")
    link_hostname: str | None = Field(default=None, serialization_alias="linkHostname")
    safe_metadata: dict[str, Any] = Field(default_factory=dict, serialization_alias="safeMetadata")
    preview_url: str | None = Field(default=None, serialization_alias="previewUrl")
    playback_url: str | None = Field(default=None, serialization_alias="playbackUrl")
    error: SourceErrorResponse | None = None
    error_code: str | None = Field(default=None, serialization_alias="errorCode")
    replacement_of_source_id: str | None = Field(default=None, serialization_alias="replacementOfSourceId")
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")


class VideoSourceFolderResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    project_id: str = Field(serialization_alias="projectId")
    content_id: str = Field(serialization_alias="contentId")
    status: FolderStatus
    revision: int
    ready_revision: int | None = Field(default=None, serialization_alias="readyRevision")
    ready_at: datetime | None = Field(default=None, serialization_alias="readyAt")
    enqueue_status: EnqueueStatus = Field(serialization_alias="enqueueStatus")
    generation_request_id: str | None = Field(default=None, serialization_alias="generationRequestId")
    sources: list[VideoSourceResponse] = Field(default_factory=list)
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")


class UploadPartInstruction(BaseModel):
    part_number: int = Field(serialization_alias="partNumber")
    upload_url: str | None = Field(default=None, serialization_alias="uploadUrl")
    expires_at: datetime | None = Field(default=None, serialization_alias="expiresAt")
    size_bytes: int = Field(serialization_alias="sizeBytes")
    headers: dict[str, str] = Field(default_factory=dict)


class UploadSessionResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    session_id: str = Field(serialization_alias="sessionId")
    source_id: str = Field(serialization_alias="sourceId")
    strategy: Literal["proxy", "multipart"]
    upload_url: str | None = Field(default=None, serialization_alias="uploadUrl")
    parts: list[UploadPartInstruction] = Field(default_factory=list)
    expires_at: datetime = Field(serialization_alias="expiresAt")


class GenerationHandoffResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    folder_id: str = Field(serialization_alias="folderId")
    ready_revision: int = Field(serialization_alias="readyRevision")
    enqueue_status: EnqueueStatus = Field(serialization_alias="enqueueStatus")
    generation_request_id: str | None = Field(default=None, serialization_alias="generationRequestId")
    error: SourceErrorResponse | None = None


class GenerateVideoResultResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    folder: VideoSourceFolderResponse
    canonical_request_id: str | None = Field(default=None, serialization_alias="canonicalRequestId")

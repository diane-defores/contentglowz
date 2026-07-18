"""Application service for source collection, readiness and generation handoff."""

from __future__ import annotations

import asyncio
from typing import Any, Protocol

from api.models.video_source_intake import (
    GenerationHandoffResponse,
    SourceErrorResponse,
    VideoSourceFolderResponse,
    VideoSourceResponse,
)
from api.services.job_store import job_store
from api.services.video_source_intake_store import VideoSourceIntakeStore, video_source_intake_store
from api.services.video_source_link_service import (
    LinkMetadataError,
    VideoSourceLinkService,
    video_source_link_service,
)
from api.services.video_source_text_service import TextSourceError, process_pasted_text
from status.service import get_status_service


class VideoGenerationDispatcher(Protocol):
    async def enqueue(
        self, *, request_id: str, descriptor: dict[str, Any], idempotency_key: str
    ) -> str: ...


class JobStoreVideoGenerationDispatcher:
    """Hands an ids-only command to the existing durable background job store."""

    async def enqueue(
        self, *, request_id: str, descriptor: dict[str, Any], idempotency_key: str
    ) -> str:
        await job_store.upsert(
            request_id,
            "video_generation_handoff",
            status="pending",
            progress=0,
            message="Video generation request accepted",
            descriptor=descriptor,
            idempotency_key=idempotency_key,
        )
        return request_id


class ProjectAssetUsageWriter(Protocol):
    def detach(
        self,
        *,
        user_id: str,
        project_id: str,
        folder_id: str,
        source_id: str,
        asset_id: str,
    ) -> None: ...


class StatusProjectAssetUsageWriter:
    def detach(
        self,
        *,
        user_id: str,
        project_id: str,
        folder_id: str,
        source_id: str,
        asset_id: str,
    ) -> None:
        get_status_service().unlink_video_source_usages(
            project_id=project_id,
            user_id=user_id,
            folder_id=folder_id,
            source_id=source_id,
        )


class VideoSourceIntakeService:
    def __init__(
        self,
        *,
        store: VideoSourceIntakeStore = video_source_intake_store,
        link_service: VideoSourceLinkService = video_source_link_service,
        generation_dispatcher: VideoGenerationDispatcher | None = None,
        asset_usage_writer: ProjectAssetUsageWriter | None = None,
    ) -> None:
        self.store = store
        self.link_service = link_service
        self.generation_dispatcher = generation_dispatcher or JobStoreVideoGenerationDispatcher()
        self.asset_usage_writer = asset_usage_writer or StatusProjectAssetUsageWriter()

    async def open_folder(self, *, user_id: str, project_id: str, content_id: str) -> VideoSourceFolderResponse:
        folder, _created = await self.store.create_or_open_folder(
            user_id=user_id, project_id=project_id, content_id=content_id
        )
        return await self._folder_response(folder)

    async def get_folder(self, *, folder_id: str, user_id: str) -> VideoSourceFolderResponse | None:
        folder = await self.store.get_folder(folder_id=folder_id, user_id=user_id)
        return await self._folder_response(folder) if folder else None

    async def add_text(
        self,
        *,
        folder_id: str,
        user_id: str,
        text: str,
        idempotency_key: str,
        expected_revision: int,
    ) -> VideoSourceFolderResponse:
        try:
            processed = process_pasted_text(text)
        except TextSourceError as exc:
            await self.store.add_source(
                folder_id=folder_id,
                user_id=user_id,
                source_type="pasted_text",
                status="failed",
                idempotency_key=idempotency_key,
                expected_revision=expected_revision,
                error_code=exc.code,
                retryable=False,
            )
        else:
            await self.store.add_source(
                folder_id=folder_id,
                user_id=user_id,
                source_type="pasted_text",
                status="ready",
                idempotency_key=idempotency_key,
                expected_revision=expected_revision,
                text_body=processed.text,
                text_preview=processed.preview,
                raw_hash=processed.raw_hash,
                normalized_hash=processed.normalized_hash,
                safe_metadata={"char_count": processed.char_count},
            )
        response = await self.get_folder(folder_id=folder_id, user_id=user_id)
        if response is None:
            raise RuntimeError("Source folder disappeared after text intake")
        return response

    async def add_link(
        self,
        *,
        folder_id: str,
        user_id: str,
        url: str,
        idempotency_key: str,
        expected_revision: int,
    ) -> VideoSourceFolderResponse:
        safe_url: str | None = None
        try:
            safe_url = self.link_service.validate_url(url)
            metadata = await self.link_service.inspect(safe_url)
        except LinkMetadataError as exc:
            await self.store.add_source(
                folder_id=folder_id,
                user_id=user_id,
                source_type="public_link",
                status="metadata_unavailable" if exc.retryable else "failed",
                idempotency_key=idempotency_key,
                expected_revision=expected_revision,
                canonical_url=safe_url,
                link_hostname=None,
                error_code=exc.code,
                retryable=exc.retryable,
            )
        else:
            await self.store.add_source(
                folder_id=folder_id,
                user_id=user_id,
                source_type="public_link",
                status="ready",
                idempotency_key=idempotency_key,
                expected_revision=expected_revision,
                canonical_url=metadata.canonical_url,
                link_hostname=metadata.hostname,
                safe_metadata={
                    "hostname": metadata.hostname,
                    "title": metadata.title,
                    "content_type": metadata.content_type,
                },
            )
        response = await self.get_folder(folder_id=folder_id, user_id=user_id)
        if response is None:
            raise RuntimeError("Source folder disappeared after link intake")
        return response

    async def remove_source(
        self,
        *,
        folder_id: str,
        source_id: str,
        user_id: str,
        expected_revision: int,
    ) -> VideoSourceFolderResponse:
        source = await self.store.get_source(
            folder_id=folder_id, source_id=source_id, user_id=user_id
        )
        await self.store.remove_source(
            folder_id=folder_id,
            source_id=source_id,
            user_id=user_id,
            expected_revision=expected_revision,
        )
        if source and source.get("asset_id"):
            await asyncio.to_thread(
                self.asset_usage_writer.detach,
                user_id=user_id,
                project_id=source["project_id"],
                folder_id=folder_id,
                source_id=source_id,
                asset_id=source["asset_id"],
            )
        response = await self.get_folder(folder_id=folder_id, user_id=user_id)
        if response is None:
            raise RuntimeError("Source folder disappeared after removal")
        return response

    async def retry_source(
        self,
        *,
        folder_id: str,
        source_id: str,
        user_id: str,
        expected_revision: int,
    ) -> VideoSourceFolderResponse:
        source = await self.store.get_source(
            folder_id=folder_id, source_id=source_id, user_id=user_id
        )
        if source is None:
            raise IntakeNotFoundError("Source not found")
        if source["source_type"].startswith("binary_"):
            raise IntakeConflictError(
                "replacement_required", "Choose a replacement file for this source."
            )
        await self.store.begin_retry(
            folder_id=folder_id,
            source_id=source_id,
            user_id=user_id,
            expected_revision=expected_revision,
        )
        if source["source_type"] == "pasted_text" and source.get("text_body"):
            try:
                processed = process_pasted_text(source["text_body"])
            except TextSourceError as exc:
                await self.store.update_source(
                    folder_id=folder_id, source_id=source_id, user_id=user_id,
                    status="failed", error_code=exc.code,
                )
            else:
                await self.store.update_source(
                    folder_id=folder_id, source_id=source_id, user_id=user_id,
                    status="ready", safe_metadata={"char_count": processed.char_count},
                )
        elif source["source_type"] == "public_link" and source.get("canonical_url"):
            try:
                metadata = await self.link_service.inspect(source["canonical_url"])
            except LinkMetadataError as exc:
                await self.store.update_source(
                    folder_id=folder_id, source_id=source_id, user_id=user_id,
                    status="metadata_unavailable" if exc.retryable else "failed",
                    error_code=exc.code, retryable=exc.retryable,
                )
            else:
                await self.store.update_source(
                    folder_id=folder_id, source_id=source_id, user_id=user_id,
                    status="ready", safe_metadata={
                        "hostname": metadata.hostname,
                        "title": metadata.title,
                        "content_type": metadata.content_type,
                    },
                )
        else:
            await self.store.update_source(
                folder_id=folder_id, source_id=source_id, user_id=user_id,
                status="failed", error_code="replacement_required",
            )
        response = await self.get_folder(folder_id=folder_id, user_id=user_id)
        if response is None:
            raise RuntimeError("Source folder disappeared after retry")
        return response

    async def mark_ready(
        self, *, folder_id: str, user_id: str, expected_revision: int
    ) -> VideoSourceFolderResponse:
        folder = await self.store.mark_ready(
            folder_id=folder_id, user_id=user_id, expected_revision=expected_revision
        )
        return await self._folder_response(folder)

    async def generate(
        self,
        *,
        folder_id: str,
        user_id: str,
        expected_revision: int,
        idempotency_key: str,
    ) -> GenerationHandoffResponse:
        handoff, _created = await self.store.create_generation_handoff(
            folder_id=folder_id,
            user_id=user_id,
            expected_revision=expected_revision,
            idempotency_key=idempotency_key,
        )
        if handoff["status"] == "enqueued" and handoff["canonical_request_id"]:
            return GenerationHandoffResponse(
                folder_id=folder_id,
                ready_revision=expected_revision,
                enqueue_status="enqueued",
                generation_request_id=handoff["canonical_request_id"],
            )
        try:
            canonical_id = await self.generation_dispatcher.enqueue(
                request_id=handoff["id"],
                descriptor=handoff["descriptor"],
                idempotency_key=idempotency_key,
            )
        except Exception:
            failed = await self.store.fail_generation_handoff(
                handoff_id=handoff["id"], user_id=user_id, error_code="orchestrator_unavailable"
            )
            return GenerationHandoffResponse(
                folder_id=folder_id,
                ready_revision=expected_revision,
                enqueue_status=failed["status"],
                error=SourceErrorResponse(
                    code="orchestrator_unavailable",
                    message="Generation could not be queued. Your sources remain ready.",
                    retryable=True,
                ),
            )
        completed = await self.store.complete_generation_handoff(
            handoff_id=handoff["id"], user_id=user_id, canonical_request_id=canonical_id
        )
        return GenerationHandoffResponse(
            folder_id=folder_id,
            ready_revision=expected_revision,
            enqueue_status=completed["status"],
            generation_request_id=completed["canonical_request_id"],
        )

    async def _folder_response(self, folder: dict[str, Any]) -> VideoSourceFolderResponse:
        sources = await self.store.list_sources(folder_id=folder["id"], user_id=folder["user_id"])
        return VideoSourceFolderResponse(
            id=folder["id"],
            project_id=folder["project_id"],
            content_id=folder["content_id"],
            status=folder["status"],
            revision=folder["revision"],
            ready_revision=folder["ready_revision"],
            ready_at=folder["ready_at"],
            enqueue_status=folder["enqueue_status"],
            generation_request_id=folder["generation_request_id"],
            sources=[await self._source_response(source) for source in sources],
            created_at=folder["created_at"],
            updated_at=folder["updated_at"],
        )

    @staticmethod
    async def _source_response(source: dict[str, Any]) -> VideoSourceResponse:
        error = None
        if source.get("error_code"):
            error = SourceErrorResponse(
                code=source["error_code"],
                message="This source needs attention before the folder can be ready.",
                retryable=bool(source.get("retryable")),
            )
        preview_url = None
        if source["source_type"] == "binary_image":
            try:
                from api.services.video_source_media_service import get_video_source_media_service

                preview_url = await asyncio.to_thread(
                    get_video_source_media_service().issue_preview_url,
                    project_id=source["project_id"],
                    user_id=source["user_id"],
                    source=source,
                )
            except Exception:
                # A preview is optional. The source remains usable if its short-lived URL cannot be issued.
                preview_url = None
        return VideoSourceResponse(
            id=source["id"],
            folder_id=source["folder_id"],
            source_type=source["source_type"],
            status=source["status"],
            asset_id=source.get("asset_id"),
            display_name=(source.get("safe_metadata") or {}).get("file_name")
            or (source.get("safe_metadata") or {}).get("title")
            or source.get("link_hostname")
            or ("Pasted text" if source["source_type"] == "pasted_text" else "Source"),
            text_preview=source.get("text_preview"),
            link_hostname=source.get("link_hostname"),
            safe_metadata=source.get("safe_metadata") or {},
            preview_url=preview_url,
            error=error,
            error_code=source.get("error_code"),
            replacement_of_source_id=source.get("replacement_of_source_id"),
            created_at=source["created_at"],
            updated_at=source["updated_at"],
        )


video_source_intake_service = VideoSourceIntakeService()

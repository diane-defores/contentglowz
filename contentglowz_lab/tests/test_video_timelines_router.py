from __future__ import annotations

from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException, Response

from api.dependencies.auth import CurrentUser
from api.models.video_timeline import (
    VideoTimelineDraftRequest,
    VideoTimelineFinalRenderRequest,
    VideoTimelineFromContentRequest,
    VideoTimelinePreviewApproveRequest,
    VideoTimelinePreviewRequest,
    VideoTimelineVersionCreateRequest,
)
from api.routers import video_timelines as router
from api.services.video_renderer_adapter import (
    UnavailableVideoRendererAdapter,
    VideoRenderDispatchResult,
    set_video_renderer_adapter_for_tests,
)
from api.services.video_timeline_store import VideoTimelineStore
from utils.libsql_async import create_client


class _FakeRenderer:
    def __init__(self, *, completed: bool = True):
        self.completed = completed

    async def request_render(self, *, job_id, render_mode, timeline_props, client_request_id=None):
        if not self.completed:
            return VideoRenderDispatchResult(
                job_id=job_id,
                status="queued",
                progress=0,
                message="Queued",
            )
        now = datetime.now(UTC)
        return VideoRenderDispatchResult(
            job_id=job_id,
            status="completed",
            progress=100,
            message="Completed",
            worker_job_id=job_id,
            artifact={
                "playback_url": f"https://api.example.test/artifact/{job_id}?token=redacted",
                "artifact_expires_at": (now + timedelta(hours=24)).isoformat(),
                "retention_expires_at": (now + timedelta(days=30)).isoformat(),
                "deletion_warning_at": (now + timedelta(days=27)).isoformat(),
                "byte_size": 123,
                "mime_type": "video/mp4",
                "file_name": f"{job_id}.mp4",
                "render_mode": render_mode,
            },
        )

    async def get_render_status(self, *, job_id):
        return VideoRenderDispatchResult(job_id=job_id, status="in_progress", progress=50)


class _FakeGcsRenderer:
    async def request_render(self, *, job_id, render_mode, timeline_props, client_request_id=None):
        return VideoRenderDispatchResult(
            job_id=job_id,
            status="queued",
            progress=0,
            message="Queued",
            worker_job_id=job_id,
        )

    async def get_render_status(self, *, job_id):
        return VideoRenderDispatchResult(
            job_id=job_id,
            status="completed",
            progress=100,
            message="Completed",
            worker_job_id=job_id,
            artifact={
                "provider": "gcs",
                "bucket": "private-render-bucket",
                "object_name": f"renders/previews/{job_id}.mp4",
                "artifact_path": f"renders/previews/{job_id}.mp4",
                "retention_expires_at": "2026-06-15T00:00:00+00:00",
                "deletion_warning_at": "2026-06-12T00:00:00+00:00",
                "byte_size": 456,
                "mime_type": "video/mp4",
                "file_name": f"{job_id}.mp4",
                "render_mode": "preview",
            },
        )


class _MismatchGcsRenderer:
    async def request_render(self, *, job_id, render_mode, timeline_props, client_request_id=None):
        return VideoRenderDispatchResult(
            job_id=job_id,
            status="completed",
            progress=100,
            message="Completed",
            worker_job_id=job_id,
            artifact={
                "provider": "gcs",
                "bucket": "private-render-bucket",
                "object_name": f"renders/previews/{job_id}-other.mp4",
                "artifact_path": f"renders/previews/{job_id}-other.mp4",
                "byte_size": 456,
                "mime_type": "video/mp4",
                "file_name": f"{job_id}-other.mp4",
                "render_mode": "preview",
            },
        )

    async def get_render_status(self, *, job_id):
        return VideoRenderDispatchResult(job_id=job_id, status="failed", progress=0)


@pytest.fixture
async def timeline_context(monkeypatch):
    from status import service as status_service_module
    from status import StatusService

    def _sqlite_conn(_db_path=None):
        import sqlite3

        conn = sqlite3.connect(":memory:")
        conn.row_factory = sqlite3.Row
        return conn

    monkeypatch.setattr(status_service_module, "get_connection", _sqlite_conn)
    status_service = StatusService()
    store = VideoTimelineStore(db_client=create_client(url=":memory:"))
    await store.ensure_tables()
    monkeypatch.setattr(router, "video_timeline_store", store)
    monkeypatch.setattr(router, "get_status_service", lambda: status_service)
    monkeypatch.setattr(
        router,
        "require_owned_content_record",
        AsyncMock(return_value=SimpleNamespace(id="content-1", title="Title", project_id="project-1")),
    )
    monkeypatch.setattr(router, "require_owned_project_id", AsyncMock(return_value="project-1"))
    set_video_renderer_adapter_for_tests(_FakeRenderer(completed=True))
    yield SimpleNamespace(
        store=store,
        status_service=status_service,
        user=CurrentUser(user_id="user-1", email="user@example.com", bearer_token="token"),
    )
    set_video_renderer_adapter_for_tests(None)


def _timeline_payload(text: str = "Visible title") -> dict:
    return {
        "schema_version": "1.0",
        "format_preset": "vertical_9_16",
        "fps": 30,
        "tracks": [{"id": "overlay", "type": "overlay", "order": 0, "exclusive": False}],
        "clips": [
            {
                "id": "title",
                "track_id": "overlay",
                "clip_type": "text",
                "start_frame": 0,
                "duration_frames": 120,
                "text": text,
            }
        ],
    }


def _asset_timeline_payload(asset_id: str, *, clip_type: str = "image") -> dict:
    track_type = "audio" if clip_type in {"audio", "music"} else "visual"
    return {
        "schema_version": "1.0",
        "format_preset": "vertical_9_16",
        "fps": 30,
        "tracks": [{"id": "main", "type": track_type, "order": 0, "exclusive": False}],
        "clips": [
            {
                "id": "clip-asset",
                "track_id": "main",
                "clip_type": clip_type,
                "start_frame": 0,
                "duration_frames": 120,
                "asset_id": asset_id,
            }
        ],
    }


def _create_project_asset(
    ctx,
    *,
    media_kind: str = "image",
    mime_type: str = "image/png",
    storage_uri: str = "https://contentglowz-test.b-cdn.net/assets/image.png?token=secret",
):
    return ctx.status_service.create_project_asset(
        project_id="project-1",
        user_id="user-1",
        media_kind=media_kind,
        source="manual_upload",
        mime_type=mime_type,
        file_name="asset.png",
        storage_uri=storage_uri,
    )


async def _create_timeline(ctx):
    response = Response()
    timeline = await router.create_or_load_video_timeline_from_content(
        VideoTimelineFromContentRequest(content_id="content-1"),
        response,
        current_user=ctx.user,
    )
    assert response.status_code == 201
    return timeline


@pytest.mark.asyncio
async def test_video_timeline_router_create_version_preview_approve_and_final(timeline_context):
    ctx = timeline_context
    timeline = await _create_timeline(ctx)

    draft = await router.save_video_timeline_draft(
        timeline.timeline_id,
        VideoTimelineDraftRequest(
            base_version_id=None,
            draft_revision=0,
            timeline=_timeline_payload("Edited title"),
        ),
        current_user=ctx.user,
    )
    assert draft.draft_revision == 1

    version = await router.create_video_timeline_version(
        timeline.timeline_id,
        VideoTimelineVersionCreateRequest(
            base_version_id=None,
            draft_revision=1,
            timeline=_timeline_payload("Edited title"),
            client_request_id="save-1",
        ),
        current_user=ctx.user,
    )
    assert version.renderer_props["composition_id"] == "ContentGlowzTimelineVideo"

    preview = await router.request_video_timeline_preview(
        timeline.timeline_id,
        version.version_id,
        VideoTimelinePreviewRequest(client_request_id="preview-1"),
        raw_request=None,
        current_user=ctx.user,
    )
    assert preview.status == "completed"
    assert preview.artifact is not None

    approved = await router.approve_video_timeline_preview(
        timeline.timeline_id,
        version.version_id,
        preview.job_id,
        VideoTimelinePreviewApproveRequest(approved=True),
        current_user=ctx.user,
    )
    assert approved.approved_preview_job_id == preview.job_id

    final = await router.request_video_timeline_final_render(
        timeline.timeline_id,
        version.version_id,
        VideoTimelineFinalRenderRequest(preview_job_id=preview.job_id, client_request_id="final-1"),
        raw_request=None,
        current_user=ctx.user,
    )
    assert final.render_mode == "final"


@pytest.mark.asyncio
async def test_video_timeline_version_resolves_render_safe_assets_and_records_usages(timeline_context):
    ctx = timeline_context
    timeline = await _create_timeline(ctx)
    asset = _create_project_asset(ctx)

    version = await router.create_video_timeline_version(
        timeline.timeline_id,
        VideoTimelineVersionCreateRequest(
            base_version_id=None,
            draft_revision=0,
            timeline=_asset_timeline_payload(asset.id),
            client_request_id="asset-save-1",
        ),
        current_user=ctx.user,
    )

    descriptor = version.renderer_props["assets"][asset.id]
    assert descriptor["render_url"] == "https://contentglowz-test.b-cdn.net/assets/image.png"
    assert "storage_uri" not in descriptor

    usages = ctx.status_service.get_project_asset_usage(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset.id,
    )
    assert {(usage.target_id, usage.usage_action, usage.placement) for usage in usages} == {
        (version.version_id, "select_for_video_version", "clip-asset"),
        (version.version_id, "use_in_remotion_render", "clip-asset"),
    }

    await router.create_video_timeline_version(
        timeline.timeline_id,
        VideoTimelineVersionCreateRequest(
            base_version_id=None,
            draft_revision=0,
            timeline=_asset_timeline_payload(asset.id),
            client_request_id="asset-save-1",
        ),
        current_user=ctx.user,
    )
    assert len(
        ctx.status_service.get_project_asset_usage(
            project_id="project-1",
            user_id="user-1",
            asset_id=asset.id,
        )
    ) == 2


@pytest.mark.asyncio
async def test_video_timeline_version_rejects_provider_temporary_asset_before_create(timeline_context):
    ctx = timeline_context
    timeline = await _create_timeline(ctx)
    asset = _create_project_asset(
        ctx,
        storage_uri="https://provider.example.com/tmp/image.png?token=secret",
    )

    with pytest.raises(HTTPException) as exc:
        await router.create_video_timeline_version(
            timeline.timeline_id,
            VideoTimelineVersionCreateRequest(
                base_version_id=None,
                draft_revision=0,
                timeline=_asset_timeline_payload(asset.id),
            ),
            current_user=ctx.user,
        )

    assert exc.value.status_code == 400
    assert exc.value.detail["code"] == "asset_not_eligible"
    persisted = await ctx.store.get_timeline(timeline_id=timeline.timeline_id, user_id=ctx.user.user_id)
    assert persisted["current_version_id"] is None


@pytest.mark.asyncio
async def test_video_timeline_router_returns_stable_conflict_error(timeline_context):
    ctx = timeline_context
    timeline = await _create_timeline(ctx)

    await router.save_video_timeline_draft(
        timeline.timeline_id,
        VideoTimelineDraftRequest(
            base_version_id=None,
            draft_revision=0,
            timeline=_timeline_payload("Edited title"),
        ),
        current_user=ctx.user,
    )

    with pytest.raises(HTTPException) as exc:
        await router.save_video_timeline_draft(
            timeline.timeline_id,
            VideoTimelineDraftRequest(
                base_version_id=None,
                draft_revision=0,
                timeline=_timeline_payload("Stale write"),
            ),
            current_user=ctx.user,
        )

    assert exc.value.status_code == 409
    assert exc.value.detail["code"] == "timeline_conflict"


@pytest.mark.asyncio
async def test_video_timeline_preview_fails_cleanly_without_renderer(timeline_context):
    ctx = timeline_context
    set_video_renderer_adapter_for_tests(UnavailableVideoRendererAdapter())
    timeline = await _create_timeline(ctx)
    version = await router.create_video_timeline_version(
        timeline.timeline_id,
        VideoTimelineVersionCreateRequest(
            base_version_id=None,
            draft_revision=0,
            timeline=_timeline_payload(),
        ),
        current_user=ctx.user,
    )

    with pytest.raises(HTTPException) as exc:
        await router.request_video_timeline_preview(
            timeline.timeline_id,
            version.version_id,
            VideoTimelinePreviewRequest(),
            raw_request=None,
            current_user=ctx.user,
        )

    assert exc.value.status_code == 503
    assert exc.value.detail["code"] == "worker_unavailable"


@pytest.mark.asyncio
async def test_video_timeline_gcs_artifact_is_signed_by_backend(timeline_context, monkeypatch):
    ctx = timeline_context
    monkeypatch.setenv("CONTENTGLOWZ_RENDER_STORAGE", "gcs")
    monkeypatch.setenv("GCS_RENDER_BUCKET", "private-render-bucket")
    monkeypatch.setenv("GCS_RENDER_PREFIX", "renders")
    signed_calls = []

    def _fake_sign(artifact):
        signed_calls.append(artifact)
        return (
            f"https://storage.googleapis.test/{artifact['bucket']}/{artifact['object_name']}?X-Goog-Signature=redacted",
            datetime(2026, 5, 14, tzinfo=UTC) + timedelta(hours=1),
        )

    monkeypatch.setattr(router, "signed_gcs_playback_url", _fake_sign)
    set_video_renderer_adapter_for_tests(_FakeGcsRenderer())
    timeline = await _create_timeline(ctx)
    version = await router.create_video_timeline_version(
        timeline.timeline_id,
        VideoTimelineVersionCreateRequest(
            base_version_id=None,
            draft_revision=0,
            timeline=_timeline_payload(),
        ),
        current_user=ctx.user,
    )

    preview = await router.request_video_timeline_preview(
        timeline.timeline_id,
        version.version_id,
        VideoTimelinePreviewRequest(),
        raw_request=None,
        current_user=ctx.user,
    )
    assert preview.status == "queued"
    stored = await ctx.store.get_job(job_id=preview.job_id, user_id=ctx.user.user_id)
    assert stored["artifact"]["provider"] == "gcs"
    assert stored["artifact"]["object_name"] == f"renders/previews/{preview.job_id}.mp4"

    refreshed = await router.get_video_timeline_render_job(
        timeline.timeline_id,
        preview.job_id,
        raw_request=SimpleNamespace(
            url_for=lambda *args, **kwargs: "https://api.example.test/local-artifact"
        ),
        current_user=ctx.user,
    )

    assert refreshed.status == "completed"
    assert refreshed.artifact is not None
    assert refreshed.artifact.playback_url.startswith("https://storage.googleapis.test/")
    assert signed_calls[0]["provider"] == "gcs"


@pytest.mark.asyncio
async def test_video_timeline_persists_expected_gcs_artifact_before_dispatch(timeline_context, monkeypatch):
    ctx = timeline_context
    monkeypatch.setenv("CONTENTGLOWZ_RENDER_STORAGE", "gcs")
    monkeypatch.setenv("GCS_RENDER_BUCKET", "private-render-bucket")
    monkeypatch.setenv("GCS_RENDER_PREFIX", "renders")
    timeline = await _create_timeline(ctx)
    version = await router.create_video_timeline_version(
        timeline.timeline_id,
        VideoTimelineVersionCreateRequest(
            base_version_id=None,
            draft_revision=0,
            timeline=_timeline_payload(),
        ),
        current_user=ctx.user,
    )

    class _AssertingRenderer:
        async def request_render(self, *, job_id, render_mode, timeline_props, client_request_id=None):
            persisted = await ctx.store.get_job(job_id=job_id, user_id=ctx.user.user_id)
            assert persisted["artifact"]["provider"] == "gcs"
            assert persisted["artifact"]["object_name"] == f"renders/previews/{job_id}.mp4"
            return VideoRenderDispatchResult(
                job_id=job_id,
                status="queued",
                progress=0,
                message="Queued",
                worker_job_id=job_id,
            )

        async def get_render_status(self, *, job_id):
            return VideoRenderDispatchResult(job_id=job_id, status="queued", progress=0)

    set_video_renderer_adapter_for_tests(_AssertingRenderer())
    preview = await router.request_video_timeline_preview(
        timeline.timeline_id,
        version.version_id,
        VideoTimelinePreviewRequest(),
        raw_request=None,
        current_user=ctx.user,
    )

    assert preview.status == "queued"


@pytest.mark.asyncio
async def test_video_timeline_rejects_mismatched_gcs_artifact(timeline_context, monkeypatch):
    ctx = timeline_context
    monkeypatch.setenv("CONTENTGLOWZ_RENDER_STORAGE", "gcs")
    monkeypatch.setenv("GCS_RENDER_BUCKET", "private-render-bucket")
    monkeypatch.setenv("GCS_RENDER_PREFIX", "renders")
    set_video_renderer_adapter_for_tests(_MismatchGcsRenderer())
    timeline = await _create_timeline(ctx)
    version = await router.create_video_timeline_version(
        timeline.timeline_id,
        VideoTimelineVersionCreateRequest(
            base_version_id=None,
            draft_revision=0,
            timeline=_timeline_payload(),
        ),
        current_user=ctx.user,
    )

    preview = await router.request_video_timeline_preview(
        timeline.timeline_id,
        version.version_id,
        VideoTimelinePreviewRequest(),
        raw_request=None,
        current_user=ctx.user,
    )

    assert preview.status == "failed"
    assert preview.message == "render_artifact_unavailable"
    assert preview.artifact is None


@pytest.mark.asyncio
async def test_video_timeline_render_capacity_returns_429(timeline_context):
    ctx = timeline_context
    timeline = await _create_timeline(ctx)
    version = await router.create_video_timeline_version(
        timeline.timeline_id,
        VideoTimelineVersionCreateRequest(
            base_version_id=None,
            draft_revision=0,
            timeline=_timeline_payload(),
        ),
        current_user=ctx.user,
    )
    await ctx.store.create_render_job(
        job_id="active-final",
        timeline_id=timeline.timeline_id,
        version_id=version.version_id,
        user_id=ctx.user.user_id,
        project_id="project-1",
        render_mode="final",
        status="queued",
    )

    with pytest.raises(HTTPException) as exc:
        await router.request_video_timeline_preview(
            timeline.timeline_id,
            version.version_id,
            VideoTimelinePreviewRequest(),
            raw_request=None,
            current_user=ctx.user,
        )

    assert exc.value.status_code == 429
    assert exc.value.headers["Retry-After"] == "60"
    assert exc.value.detail["code"] == "render_capacity_exhausted"

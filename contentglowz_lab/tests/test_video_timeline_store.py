from __future__ import annotations

import pytest

from api.models.video_timeline import VideoTimelineDocument
from api.services.remotion_timeline_props import build_remotion_timeline_props
from api.services.video_timeline_store import (
    VideoTimelineConflictError,
    VideoTimelineStore,
)
from utils.libsql_async import create_client


def _timeline(text: str = "Visible title") -> dict:
    return VideoTimelineDocument(
        schema_version="1.0",
        format_preset="vertical_9_16",
        fps=30,
        tracks=[{"id": "overlay", "type": "overlay", "order": 0, "exclusive": False}],
        clips=[
            {
                "id": "title",
                "track_id": "overlay",
                "clip_type": "text",
                "start_frame": 0,
                "duration_frames": 120,
                "text": text,
            }
        ],
    ).model_dump(mode="json")


@pytest.mark.asyncio
async def test_video_timeline_store_create_version_conflict_and_stale_jobs():
    store = VideoTimelineStore(db_client=create_client(url=":memory:"))
    await store.ensure_tables()

    timeline, created = await store.create_or_get_active(
        user_id="user-1",
        project_id="project-1",
        content_id="content-1",
        format_preset="vertical_9_16",
        draft=_timeline(),
    )
    same, duplicated = await store.create_or_get_active(
        user_id="user-1",
        project_id="project-1",
        content_id="content-1",
        format_preset="vertical_9_16",
        draft=_timeline("Other title"),
    )

    assert created is True
    assert duplicated is False
    assert same["id"] == timeline["id"]

    saved = await store.save_draft(
        timeline_id=timeline["id"],
        user_id="user-1",
        base_version_id=None,
        draft_revision=0,
        timeline=_timeline("Updated title"),
    )
    assert saved["draft_revision"] == 1

    with pytest.raises(VideoTimelineConflictError):
        await store.save_draft(
            timeline_id=timeline["id"],
            user_id="user-1",
            base_version_id=None,
            draft_revision=0,
            timeline=_timeline("Stale write"),
        )

    version_id = "version-1"
    version = await store.create_version(
        timeline_id=timeline["id"],
        user_id="user-1",
        version_id=version_id,
        base_version_id=None,
        draft_revision=1,
        timeline=_timeline("Updated title"),
        renderer_props=build_remotion_timeline_props(
            timeline_id=timeline["id"],
            version_id=version_id,
            timeline=_timeline("Updated title"),
        ),
        client_request_id="save-1",
    )
    assert version["version_number"] == 1

    duplicate = await store.create_version(
        timeline_id=timeline["id"],
        user_id="user-1",
        version_id="unused-version",
        base_version_id=None,
        draft_revision=1,
        timeline=_timeline("Updated title"),
        renderer_props={},
        client_request_id="save-1",
    )
    assert duplicate["id"] == "version-1"

    await store.create_render_job(
        job_id="preview-1",
        timeline_id=timeline["id"],
        version_id=version["id"],
        user_id="user-1",
        project_id="project-1",
        render_mode="preview",
        status="completed",
        progress=100,
        artifact={"playback_url": "https://api.example/render.mp4"},
    )
    current = await store.get_timeline(timeline_id=timeline["id"], user_id="user-1")
    second_version_id = "version-2"
    await store.create_version(
        timeline_id=timeline["id"],
        user_id="user-1",
        version_id=second_version_id,
        base_version_id=version["id"],
        draft_revision=current["draft_revision"],
        timeline=_timeline("New version"),
        renderer_props=build_remotion_timeline_props(
            timeline_id=timeline["id"],
            version_id=second_version_id,
            timeline=_timeline("New version"),
        ),
    )

    stale_job = await store.get_job(job_id="preview-1", user_id="user-1")
    assert stale_job["stale"] is True

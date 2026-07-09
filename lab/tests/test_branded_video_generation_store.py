from __future__ import annotations

import pytest

from api.services.branded_video_generation_store import BrandedVideoGenerationRunStore
from utils.libsql_async import create_client


@pytest.mark.asyncio
async def test_generation_run_store_create_reuse_update_and_list():
    store = BrandedVideoGenerationRunStore(db_client=create_client(url=":memory:"))
    await store.ensure_table()

    run, created = await store.create_or_get_run(
        user_id="user-1",
        project_id="project-1",
        content_id="content-1",
        format_preset="vertical_9_16",
        trigger_source="feed_refresh",
    )
    same, duplicated = await store.create_or_get_run(
        user_id="user-1",
        project_id="project-1",
        content_id="content-1",
        format_preset="vertical_9_16",
        trigger_source="feed_refresh",
    )

    assert created is True
    assert duplicated is False
    assert same["id"] == run["id"]
    assert same["readiness"] == "preparing"

    updated = await store.update_run(
        run_id=run["id"],
        user_id="user-1",
        status="ready",
        readiness="ready_to_publish",
        blockers_json='["none"]',
        timeline_id="timeline-1",
        version_id="version-1",
        final_job_id="final-1",
    )

    assert updated["status"] == "ready"
    assert updated["readiness"] == "ready_to_publish"
    assert updated["timeline_id"] == "timeline-1"
    assert updated["version_id"] == "version-1"
    assert updated["final_job_id"] == "final-1"
    assert updated["blockers"] == ["none"]

    listed = await store.list_by_project(
        user_id="user-1",
        project_id="project-1",
    )
    assert len(listed) == 1
    assert listed[0]["id"] == run["id"]

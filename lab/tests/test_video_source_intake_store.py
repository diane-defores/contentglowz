from __future__ import annotations

import pytest

from api.services.video_source_intake_store import (
    IntakeConflictError,
    VideoSourceIntakeStore,
)
from utils.libsql_async import create_client


@pytest.fixture
async def store():
    instance = VideoSourceIntakeStore(db_client=create_client(url=":memory:"))
    await instance.ensure_tables()
    return instance


@pytest.mark.asyncio
async def test_create_open_is_idempotent_and_project_scoped(store):
    first, created = await store.create_or_open_folder(
        user_id="user-1", project_id="project-1", content_id="content-1"
    )
    second, created_again = await store.create_or_open_folder(
        user_id="user-1", project_id="project-1", content_id="content-1"
    )

    assert created is True
    assert created_again is False
    assert second["id"] == first["id"]
    assert await store.get_folder(folder_id=first["id"], user_id="user-2") is None


@pytest.mark.asyncio
async def test_ready_does_not_enqueue_and_mutation_invalidates_readiness(store):
    folder, _ = await store.create_or_open_folder(
        user_id="user-1", project_id="project-1", content_id="content-1"
    )
    source, replayed = await store.add_source(
        folder_id=folder["id"],
        user_id="user-1",
        source_type="pasted_text",
        status="ready",
        idempotency_key="text-1",
        text_preview="A useful source",
        normalized_hash="hash-1",
        safe_metadata={"char_count": 15},
    )
    assert replayed is False

    ready = await store.mark_ready(
        folder_id=folder["id"], user_id="user-1", expected_revision=1
    )
    assert ready["status"] == "ready"
    assert ready["ready_revision"] == 1
    assert ready["enqueue_status"] == "not_requested"

    await store.remove_source(
        folder_id=folder["id"],
        source_id=source["id"],
        user_id="user-1",
        expected_revision=1,
    )
    changed = await store.get_folder(folder_id=folder["id"], user_id="user-1")
    assert changed["status"] == "changed_after_ready"
    assert changed["revision"] == 2


@pytest.mark.asyncio
async def test_readiness_rejects_empty_pending_and_stale_revisions(store):
    folder, _ = await store.create_or_open_folder(
        user_id="user-1", project_id="project-1", content_id="content-1"
    )
    with pytest.raises(IntakeConflictError) as empty:
        await store.mark_ready(
            folder_id=folder["id"], user_id="user-1", expected_revision=0
        )
    assert empty.value.code == "sources_not_ready"

    await store.add_source(
        folder_id=folder["id"],
        user_id="user-1",
        source_type="public_link",
        status="metadata_unavailable",
        idempotency_key="link-1",
        safe_metadata={"hostname": "example.com"},
    )
    with pytest.raises(IntakeConflictError) as pending:
        await store.mark_ready(
            folder_id=folder["id"], user_id="user-1", expected_revision=1
        )
    assert pending.value.code == "sources_not_ready"

    with pytest.raises(IntakeConflictError) as stale:
        await store.mark_ready(
            folder_id=folder["id"], user_id="user-1", expected_revision=0
        )
    assert stale.value.code == "stale_revision"


@pytest.mark.asyncio
async def test_generation_handoff_is_ids_only_and_idempotent(store):
    folder, _ = await store.create_or_open_folder(
        user_id="user-1", project_id="project-1", content_id="content-1"
    )
    await store.add_source(
        folder_id=folder["id"],
        user_id="user-1",
        source_type="pasted_text",
        status="ready",
        idempotency_key="text-1",
        text_preview="Private preview",
        normalized_hash="hash-1",
        safe_metadata={"char_count": 15},
    )
    await store.mark_ready(folder_id=folder["id"], user_id="user-1", expected_revision=1)

    first, created = await store.create_generation_handoff(
        folder_id=folder["id"],
        user_id="user-1",
        expected_revision=1,
        idempotency_key="generate-1",
    )
    second, created_again = await store.create_generation_handoff(
        folder_id=folder["id"],
        user_id="user-1",
        expected_revision=1,
        idempotency_key="generate-1",
    )

    assert created is True
    assert created_again is False
    assert second["id"] == first["id"]
    assert set(first["descriptor"]) == {
        "folder_id", "project_id", "content_id", "sources_ready_revision", "source_ids"
    }
    assert "text" not in str(first["descriptor"]).lower()
    assert "url" not in str(first["descriptor"]).lower()

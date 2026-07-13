from __future__ import annotations

import pytest

from api.services.video_source_intake_service import VideoSourceIntakeService
from api.services.video_source_intake_store import VideoSourceIntakeStore
from utils.libsql_async import create_client


class _Dispatcher:
    def __init__(self, *, fail: bool = False):
        self.fail = fail
        self.calls = []

    async def enqueue(self, *, request_id, descriptor, idempotency_key):
        self.calls.append((request_id, descriptor, idempotency_key))
        if self.fail:
            raise RuntimeError("provider detail must not escape")
        return f"canonical-{request_id}"


class _UsageWriter:
    def __init__(self):
        self.calls = []

    def detach(self, **kwargs):
        self.calls.append(kwargs)


async def _service(*, fail_dispatch: bool = False):
    store = VideoSourceIntakeStore(db_client=create_client(url=":memory:"))
    await store.ensure_tables()
    dispatcher = _Dispatcher(fail=fail_dispatch)
    usage_writer = _UsageWriter()
    service = VideoSourceIntakeService(
        store=store,
        generation_dispatcher=dispatcher,
        asset_usage_writer=usage_writer,
    )
    return service, store, dispatcher, usage_writer


@pytest.mark.asyncio
async def test_ready_only_never_dispatches_and_response_redacts_private_text():
    service, _store, dispatcher, _usage_writer = await _service()
    folder = await service.open_folder(
        user_id="user-1", project_id="project-1", content_id="content-1"
    )
    folder = await service.add_text(
        folder_id=folder.id,
        user_id="user-1",
        text="Private campaign notes",
        idempotency_key="text-1",
        expected_revision=0,
    )
    ready = await service.mark_ready(
        folder_id=folder.id, user_id="user-1", expected_revision=1
    )

    assert ready.status == "ready"
    assert ready.enqueue_status == "not_requested"
    assert dispatcher.calls == []
    payload = ready.model_dump(mode="json")
    assert payload["sources"][0]["text_preview"] == "Private campaign notes"
    assert "text_body" not in payload["sources"][0]
    assert "raw_hash" not in payload["sources"][0]


@pytest.mark.asyncio
async def test_generate_dispatches_ids_only_once_for_network_retry():
    service, _store, dispatcher, _usage_writer = await _service()
    folder = await service.open_folder(
        user_id="user-1", project_id="project-1", content_id="content-1"
    )
    folder = await service.add_text(
        folder_id=folder.id,
        user_id="user-1",
        text="Private campaign notes",
        idempotency_key="text-1",
        expected_revision=0,
    )

    first = await service.generate(
        folder_id=folder.id,
        user_id="user-1",
        expected_revision=1,
        idempotency_key="generate-1",
    )
    second = await service.generate(
        folder_id=folder.id,
        user_id="user-1",
        expected_revision=1,
        idempotency_key="generate-1",
    )

    assert first.enqueue_status == "enqueued"
    assert second.generation_request_id == first.generation_request_id
    assert len(dispatcher.calls) == 1
    descriptor = dispatcher.calls[0][1]
    assert set(descriptor) == {
        "folder_id", "project_id", "content_id", "sources_ready_revision", "source_ids"
    }
    assert "Private campaign notes" not in str(descriptor)


@pytest.mark.asyncio
async def test_dispatch_failure_keeps_folder_ready_and_is_retryable():
    service, store, dispatcher, _usage_writer = await _service(fail_dispatch=True)
    folder = await service.open_folder(
        user_id="user-1", project_id="project-1", content_id="content-1"
    )
    folder = await service.add_text(
        folder_id=folder.id,
        user_id="user-1",
        text="Source",
        idempotency_key="text-1",
        expected_revision=0,
    )

    result = await service.generate(
        folder_id=folder.id,
        user_id="user-1",
        expected_revision=1,
        idempotency_key="generate-1",
    )
    persisted = await store.get_folder(folder_id=folder.id, user_id="user-1")

    assert result.enqueue_status == "enqueue_failed"
    assert result.error is not None and result.error.retryable is True
    assert "provider detail" not in result.error.message
    assert persisted["status"] == "ready"
    assert persisted["enqueue_status"] == "enqueue_failed"


@pytest.mark.asyncio
async def test_remove_binary_source_unlinks_only_its_intake_usage():
    service, store, _dispatcher, usage_writer = await _service()
    folder = await service.open_folder(
        user_id="user-1", project_id="project-1", content_id="content-1"
    )
    source, _ = await store.add_source(
        folder_id=folder.id,
        user_id="user-1",
        source_type="binary_image",
        status="ready",
        asset_id="asset-1",
        idempotency_key="binary-1",
        expected_revision=0,
    )

    result = await service.remove_source(
        folder_id=folder.id,
        source_id=source["id"],
        user_id="user-1",
        expected_revision=1,
    )

    assert result.sources == []
    assert usage_writer.calls == [
        {
            "user_id": "user-1",
            "project_id": "project-1",
            "folder_id": folder.id,
            "source_id": source["id"],
            "asset_id": "asset-1",
        }
    ]

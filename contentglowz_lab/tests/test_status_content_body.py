import sqlite3

import pytest


@pytest.fixture
def status_service(monkeypatch):
    from status import service as status_service_module
    from status import StatusService

    def _sqlite_conn(_db_path=None):
        conn = sqlite3.connect(":memory:")
        conn.row_factory = sqlite3.Row
        return conn

    monkeypatch.setattr(status_service_module, "get_connection", _sqlite_conn)
    return StatusService()


def test_content_body_versions_and_edit_history(status_service):
    record = status_service.create_content(
        title="Draft title",
        content_type="article",
        source_robot="manual",
        status="pending_review",
        user_id="user-1",
        content_preview="Preview only",
    )

    first = status_service.save_content_body(
        record.id,
        "Full body v1",
        edited_by="user-1",
        edit_note="initial body",
    )
    second = status_service.save_content_body(
        record.id,
        "Full body v2",
        edited_by="user-1",
        edit_note="edited body",
    )

    latest = status_service.get_content_body(record.id)
    first_version = status_service.get_content_body(record.id, version=1)
    history = status_service.get_edit_history(record.id)
    refreshed = status_service.get_content(record.id)

    assert first["version"] == 1
    assert second["version"] == 2
    assert latest["body"] == "Full body v2"
    assert latest["version"] == 2
    assert first_version["body"] == "Full body v1"
    assert refreshed.current_version == 2
    assert [event["new_version"] for event in history] == [2, 1]
    assert history[0]["edit_note"] == "edited body"


def test_content_body_returns_none_when_no_version_exists(status_service):
    record = status_service.create_content(
        title="Draft title",
        content_type="article",
        source_robot="manual",
        status="pending_review",
        user_id="user-1",
        content_preview="Preview only",
    )

    assert status_service.get_content_body(record.id) is None

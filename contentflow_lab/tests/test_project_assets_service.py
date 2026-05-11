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


def _create_content(status_service, *, project_id="project-1", user_id="user-1"):
    return status_service.create_content(
        title="Draft title",
        content_type="article",
        source_robot="manual",
        status="pending_review",
        project_id=project_id,
        user_id=user_id,
        content_preview="Preview",
    )


def _create_project_asset(
    status_service,
    *,
    content=None,
    project_id="project-1",
    user_id="user-1",
    mime_type="image/png",
    kind="image",
    status="uploaded",
):
    content = content or _create_content(status_service, project_id=project_id, user_id=user_id)
    content_asset = status_service.create_content_asset(
        content_id=content.id,
        project_id=project_id,
        user_id=user_id,
        kind=kind,
        mime_type=mime_type,
        storage_uri="bunny://zone/path",
        status=status,
    )
    assets = status_service.list_project_assets(project_id=project_id, user_id=user_id)
    return next(asset for asset in assets if asset.content_asset_id == content_asset.id)


def _usage_count(status_service):
    row = status_service._conn.execute("SELECT COUNT(*) AS count FROM project_asset_usages").fetchone()
    return row["count"]


def test_select_project_asset_validates_content_target_same_project_and_user(status_service):
    from status.service import ProjectAssetEligibilityError

    content = _create_content(status_service)
    asset = _create_project_asset(status_service, content=content)

    usage = status_service.select_project_asset(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset.id,
        target_type="content",
        target_id=content.id,
        usage_action="select_for_content",
        placement="hero",
        is_primary=True,
    )

    assert usage.target_id == content.id
    assert usage.is_primary is True
    assert _usage_count(status_service) == 1

    with pytest.raises(ProjectAssetEligibilityError):
        status_service.select_project_asset(
            project_id="project-1",
            user_id="user-1",
            asset_id=asset.id,
            target_type="content",
            target_id=content.id,
            usage_action="unsupported_action",
        )
    assert _usage_count(status_service) == 1


def test_project_asset_selection_records_event_and_eligibility(status_service):
    content = _create_content(status_service)
    asset = _create_project_asset(status_service, content=content)

    eligible = status_service.get_project_asset_eligibility(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset.id,
        usage_action="select_for_content",
        target_type="content",
        target_id=content.id,
    )
    assert eligible["eligible"] is True

    status_service.select_project_asset(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset.id,
        target_type="content",
        target_id=content.id,
        usage_action="select_for_content",
        placement="hero",
        is_primary=True,
    )

    events = status_service.get_project_asset_events(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset.id,
    )
    assert events[0].event_type == "selected"
    assert events[0].target_id == content.id
    assert events[0].metadata["usage_action"] == "select_for_content"


def test_project_asset_eligibility_reports_invalid_target_without_mutation(status_service):
    content = _create_content(status_service)
    asset = _create_project_asset(status_service, content=content)

    result = status_service.get_project_asset_eligibility(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset.id,
        usage_action="select_for_content",
        target_type="content",
        target_id="missing-content",
    )

    assert result["eligible"] is False
    assert "not found" in result["reason"]
    assert _usage_count(status_service) == 0


def test_select_project_asset_rejects_foreign_content_target_without_mutation(status_service):
    from status.service import ContentNotFoundError

    owned_content = _create_content(status_service, project_id="project-1", user_id="user-1")
    foreign_content = _create_content(status_service, project_id="project-2", user_id="user-1")
    asset = _create_project_asset(status_service, content=owned_content)

    with pytest.raises(ContentNotFoundError):
        status_service.select_project_asset(
            project_id="project-1",
            user_id="user-1",
            asset_id=asset.id,
            target_type="content",
            target_id=foreign_content.id,
            usage_action="select_for_content",
            placement="hero",
            is_primary=True,
        )

    assert _usage_count(status_service) == 0


def test_select_project_asset_primary_replaces_existing_primary(status_service):
    content = _create_content(status_service)
    first_asset = _create_project_asset(status_service, content=content)
    second_asset = _create_project_asset(
        status_service,
        content=content,
        mime_type="image/jpeg",
        kind="image",
    )

    first_usage = status_service.select_project_asset(
        project_id="project-1",
        user_id="user-1",
        asset_id=first_asset.id,
        target_type="content",
        target_id=content.id,
        usage_action="select_for_content",
        placement="hero",
        is_primary=True,
    )
    second_usage = status_service.select_project_asset(
        project_id="project-1",
        user_id="user-1",
        asset_id=second_asset.id,
        target_type="content",
        target_id=content.id,
        usage_action="select_for_content",
        placement="hero",
        is_primary=True,
    )

    rows = status_service._conn.execute(
        """
        SELECT id, is_primary FROM project_asset_usages
        WHERE project_id = ? AND target_type = ? AND target_id = ? AND placement = ?
        ORDER BY created_at ASC
        """,
        ("project-1", "content", content.id, "hero"),
    ).fetchall()

    assert [row["id"] for row in rows] == [first_usage.id, second_usage.id]
    assert [row["is_primary"] for row in rows] == [0, 1]


def test_clear_project_asset_primary_records_event(status_service):
    content = _create_content(status_service)
    asset = _create_project_asset(status_service, content=content)
    status_service.set_project_asset_primary(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset.id,
        target_type="content",
        target_id=content.id,
        usage_action="select_for_content",
        placement="hero",
    )

    changed = status_service.clear_project_asset_primary(
        project_id="project-1",
        user_id="user-1",
        target_type="content",
        target_id=content.id,
        placement="hero",
    )

    events = status_service.get_project_asset_events(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset.id,
    )
    assert changed == 1
    assert events[0].event_type == "primary_cleared"


def test_set_project_asset_primary_rejects_incompatible_content_media_kind_without_mutation(status_service):
    from status.service import ProjectAssetEligibilityError

    content = _create_content(status_service)
    asset = _create_project_asset(
        status_service,
        content=content,
        mime_type="audio/mpeg",
        kind="audio",
    )

    with pytest.raises(ProjectAssetEligibilityError, match="Incompatible media_kind"):
        status_service.set_project_asset_primary(
            project_id="project-1",
            user_id="user-1",
            asset_id=asset.id,
            target_type="content",
            target_id=content.id,
            usage_action="set_primary",
            placement="hero",
        )

    assert _usage_count(status_service) == 0


def test_tombstone_restore_records_events(status_service):
    content = _create_content(status_service)
    asset = _create_project_asset(status_service, content=content)

    tombstoned = status_service.tombstone_project_asset(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset.id,
    )
    restored = status_service.restore_project_asset(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset.id,
    )

    events = status_service.get_project_asset_events(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset.id,
    )
    assert tombstoned.status == "tombstoned"
    assert restored.status == "active"
    assert [event.event_type for event in events[:2]] == ["restored", "tombstoned"]


def test_select_project_asset_rejects_wrong_target_type_without_mutation(status_service):
    from status.service import ProjectAssetEligibilityError

    content = _create_content(status_service)
    asset = _create_project_asset(status_service, content=content)

    with pytest.raises(ProjectAssetEligibilityError, match="requires target_type"):
        status_service.select_project_asset(
            project_id="project-1",
            user_id="user-1",
            asset_id=asset.id,
            target_type="video_version",
            target_id="video-version-1",
            usage_action="select_for_content",
        )

    assert _usage_count(status_service) == 0


def test_select_project_asset_rejects_video_version_until_store_exists(status_service):
    from status.service import ProjectAssetEligibilityError

    content = _create_content(status_service)
    asset = _create_project_asset(
        status_service,
        content=content,
        mime_type="audio/mpeg",
        kind="audio",
    )

    with pytest.raises(ProjectAssetEligibilityError, match="video_version target validation"):
        status_service.select_project_asset(
            project_id="project-1",
            user_id="user-1",
            asset_id=asset.id,
            target_type="video_version",
            target_id="video-version-1",
            usage_action="select_for_video_version",
        )

    assert _usage_count(status_service) == 0

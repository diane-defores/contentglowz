from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from api.models.status import (
    ClearProjectAssetPrimaryRequest,
    ProjectAssetEligibilityRequest,
    ProjectAssetPrimaryRequest,
    SelectProjectAssetRequest,
)
from api.routers import assets as router
from status.service import ContentNotFoundError, ProjectAssetEligibilityError


def _asset(asset_id: str = "asset-1", status: str = "active", media_kind: str = "image"):
    now = datetime.utcnow()
    return SimpleNamespace(
        id=asset_id,
        project_id="project-1",
        user_id="user-1",
        source_asset_id=None,
        content_asset_id="content-asset-1",
        media_kind=media_kind,
        source="content_asset",
        mime_type="image/png",
        file_name="file.png",
        storage_uri="bunny://zone/path",
        status=status,
        metadata={},
        created_at=now,
        updated_at=now,
        tombstoned_at=None,
        cleanup_eligible_at=None,
        model_dump=lambda: {
            "id": asset_id,
            "project_id": "project-1",
            "user_id": "user-1",
            "source_asset_id": None,
            "content_asset_id": "content-asset-1",
            "media_kind": media_kind,
            "source": "content_asset",
            "mime_type": "image/png",
            "file_name": "file.png",
            "storage_uri": "bunny://zone/path",
            "status": status,
            "metadata": {},
            "created_at": now,
            "updated_at": now,
            "tombstoned_at": None,
            "cleanup_eligible_at": None,
        },
    )


def _usage():
    now = datetime.utcnow()
    return SimpleNamespace(
        model_dump=lambda: {
            "id": "usage-1",
            "asset_id": "asset-1",
            "project_id": "project-1",
            "user_id": "user-1",
            "target_type": "content",
            "target_id": "content-1",
            "placement": "hero",
            "usage_action": "select_for_content",
            "is_primary": True,
            "metadata": {},
            "created_at": now,
            "updated_at": now,
            "deleted_at": None,
        }
    )


def _event():
    now = datetime.utcnow()
    return SimpleNamespace(
        model_dump=lambda: {
            "id": "event-1",
            "asset_id": "asset-1",
            "project_id": "project-1",
            "user_id": "user-1",
            "event_type": "selected",
            "target_type": "content",
            "target_id": "content-1",
            "placement": "hero",
            "metadata": {},
            "created_at": now,
        }
    )


@pytest.mark.asyncio
async def test_list_project_assets_returns_items(monkeypatch):
    monkeypatch.setattr(router, "require_owned_project_id", AsyncMock(return_value="project-1"))
    fake_service = SimpleNamespace(list_project_assets=lambda **_: [_asset()])
    monkeypatch.setattr(router, "get_status_service", lambda: fake_service)

    response = await router.list_project_assets(
        project_id="project-1",
        current_user=SimpleNamespace(user_id="user-1"),
    )
    assert response.total == 1
    assert response.items[0].id == "asset-1"
    assert response.items[0].storage_uri is None
    assert response.items[0].storage_descriptor["state"] == "durable_bunny"


@pytest.mark.asyncio
async def test_get_project_asset_detail_returns_404(monkeypatch):
    monkeypatch.setattr(router, "require_owned_project_id", AsyncMock(return_value="project-1"))
    fake_service = SimpleNamespace(
        get_project_asset_detail=lambda **_: (_ for _ in ()).throw(ContentNotFoundError("not found"))
    )
    monkeypatch.setattr(router, "get_status_service", lambda: fake_service)

    with pytest.raises(HTTPException) as exc:
        await router.get_project_asset_detail(
            project_id="project-1",
            asset_id="missing",
            current_user=SimpleNamespace(user_id="user-1"),
        )
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_select_project_asset_returns_conflict_for_ineligible(monkeypatch):
    monkeypatch.setattr(router, "require_owned_project_id", AsyncMock(return_value="project-1"))
    fake_service = SimpleNamespace(
        select_project_asset=lambda **_: (_ for _ in ()).throw(ProjectAssetEligibilityError("ineligible"))
    )
    monkeypatch.setattr(router, "get_status_service", lambda: fake_service)

    with pytest.raises(HTTPException) as exc:
        await router.select_project_asset(
            project_id="project-1",
            asset_id="asset-1",
            request=SelectProjectAssetRequest(
                target_type="content",
                target_id="content-1",
                usage_action="select_for_content",
                is_primary=True,
            ),
            current_user=SimpleNamespace(user_id="user-1"),
        )
    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_project_asset_eligibility_returns_result(monkeypatch):
    monkeypatch.setattr(router, "require_owned_project_id", AsyncMock(return_value="project-1"))
    fake_service = SimpleNamespace(
        get_project_asset_eligibility=lambda **_: {
            "asset_id": "asset-1",
            "usage_action": "select_for_content",
            "target_type": "content",
            "target_id": "content-1",
            "eligible": True,
            "reason": None,
        }
    )
    monkeypatch.setattr(router, "get_status_service", lambda: fake_service)

    response = await router.get_project_asset_eligibility(
        project_id="project-1",
        asset_id="asset-1",
        request=ProjectAssetEligibilityRequest(
            usage_action="select_for_content",
            target_type="content",
            target_id="content-1",
        ),
        current_user=SimpleNamespace(user_id="user-1"),
    )

    assert response.eligible is True


@pytest.mark.asyncio
async def test_get_project_asset_events_returns_items(monkeypatch):
    monkeypatch.setattr(router, "require_owned_project_id", AsyncMock(return_value="project-1"))
    fake_service = SimpleNamespace(get_project_asset_events=lambda **_: [_event()])
    monkeypatch.setattr(router, "get_status_service", lambda: fake_service)

    response = await router.get_project_asset_events(
        project_id="project-1",
        asset_id="asset-1",
        current_user=SimpleNamespace(user_id="user-1"),
    )

    assert response[0].event_type == "selected"


@pytest.mark.asyncio
async def test_set_and_clear_project_asset_primary(monkeypatch):
    monkeypatch.setattr(router, "require_owned_project_id", AsyncMock(return_value="project-1"))
    fake_service = SimpleNamespace(
        set_project_asset_primary=lambda **_: _usage(),
        clear_project_asset_primary=lambda **_: 1,
    )
    monkeypatch.setattr(router, "get_status_service", lambda: fake_service)

    primary = await router.set_project_asset_primary(
        project_id="project-1",
        asset_id="asset-1",
        request=ProjectAssetPrimaryRequest(
            target_type="content",
            target_id="content-1",
            usage_action="select_for_content",
            placement="hero",
        ),
        current_user=SimpleNamespace(user_id="user-1"),
    )
    cleared = await router.clear_project_asset_primary(
        project_id="project-1",
        request=ClearProjectAssetPrimaryRequest(
            target_type="content",
            target_id="content-1",
            placement="hero",
        ),
        current_user=SimpleNamespace(user_id="user-1"),
    )

    assert primary.is_primary is True
    assert cleared.cleared_count == 1


@pytest.mark.asyncio
async def test_cleanup_report_route(monkeypatch):
    monkeypatch.setattr(router, "require_owned_project_id", AsyncMock(return_value="project-1"))
    fake_service = SimpleNamespace(list_project_assets=lambda **_: [_asset(status="degraded")])
    monkeypatch.setattr(router, "get_status_service", lambda: fake_service)

    response = await router.get_project_asset_cleanup_report(
        project_id="project-1",
        current_user=SimpleNamespace(user_id="user-1"),
    )

    assert response.degraded[0].asset_id == "asset-1"
    assert response.physical_delete_allowed is False

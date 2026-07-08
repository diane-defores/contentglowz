import pytest
from fastapi import HTTPException, status

from api.models.brand_profile import BrandProfileCreateRequest, BrandProfileUpdateRequest
from api.routers import brand_profiles as router
from api.services.brand_profile_store import DefaultBrandProfileDeletionError


class _FakeStore:
    def __init__(self):
        self.items = {}

    async def list_brand_profiles(self, *, user_id: str, project_id: str):
        return [
            item for item in self.items.values()
            if item["user_id"] == user_id and item["project_id"] == project_id
        ]

    async def create_brand_profile(self, *, user_id: str, payload: dict):
        item = {
            "id": "brand-1",
            "user_id": user_id,
            "project_id": payload["project_id"],
            "name": payload["name"],
            "logo_asset_id": payload.get("logo_asset_id"),
            "primary_colors": payload.get("primary_colors", []),
            "secondary_colors": payload.get("secondary_colors", []),
            "font_heading": payload.get("font_heading"),
            "font_body": payload.get("font_body"),
            "tone_keywords": payload.get("tone_keywords", []),
            "cta_defaults": payload.get("cta_defaults"),
            "caption_style_defaults": payload.get("caption_style_defaults"),
            "motion_intensity": payload.get("motion_intensity", "medium"),
            "transition_family": payload.get("transition_family"),
            "intro_module_enabled": payload.get("intro_module_enabled", True),
            "outro_module_enabled": payload.get("outro_module_enabled", True),
            "is_default": payload.get("is_default", False),
            "revision": 1,
            "created_at": "2026-07-05T00:00:00+00:00",
            "updated_at": "2026-07-05T00:00:00+00:00",
        }
        self.items[item["id"]] = item
        return item

    async def get_brand_profile(self, *, brand_profile_id: str, user_id: str):
        item = self.items.get(brand_profile_id)
        if item and item["user_id"] == user_id:
            return item
        return None

    async def update_brand_profile(self, *, brand_profile_id: str, user_id: str, payload: dict):
        item = await self.get_brand_profile(brand_profile_id=brand_profile_id, user_id=user_id)
        if not item:
            return None
        item.update(payload)
        item["revision"] += 1
        item["updated_at"] = "2026-07-05T01:00:00+00:00"
        return item

    async def delete_brand_profile(self, *, brand_profile_id: str, user_id: str):
        item = await self.get_brand_profile(brand_profile_id=brand_profile_id, user_id=user_id)
        if not item:
            return False
        if item["is_default"]:
            raise DefaultBrandProfileDeletionError(
                "Set another brand profile as default before deleting this one."
            )
        del self.items[brand_profile_id]
        return True


class _CurrentUser:
    user_id = "user-1"


@pytest.mark.asyncio
async def test_brand_profiles_router_crud(monkeypatch):
    fake_store = _FakeStore()

    async def _require_owned_project_id(project_id, current_user):
        assert project_id == "project-1"
        assert current_user.user_id == "user-1"
        return project_id

    monkeypatch.setattr(router, "brand_profile_store", fake_store)
    monkeypatch.setattr(router, "require_owned_project_id", _require_owned_project_id)

    created = await router.create_brand_profile(
        BrandProfileCreateRequest(projectId="project-1", name="Core Brand", isDefault=False),
        current_user=_CurrentUser(),
    )
    assert created.project_id == "project-1"
    assert created.is_default is False

    listed = await router.list_brand_profiles(projectId="project-1", current_user=_CurrentUser())
    assert len(listed) == 1
    assert listed[0].name == "Core Brand"

    fetched = await router.get_brand_profile("brand-1", current_user=_CurrentUser())
    assert fetched.id == "brand-1"

    updated = await router.update_brand_profile(
        "brand-1",
        BrandProfileUpdateRequest(name="Core Brand 2"),
        current_user=_CurrentUser(),
    )
    assert updated.name == "Core Brand 2"
    assert updated.revision == 2

    deleted = await router.delete_brand_profile("brand-1", current_user=_CurrentUser())
    assert deleted["success"] is True


@pytest.mark.asyncio
async def test_brand_profiles_router_blocks_default_profile_deletion(monkeypatch):
    fake_store = _FakeStore()
    fake_store.items["brand-1"] = {
        "id": "brand-1",
        "user_id": "user-1",
        "project_id": "project-1",
        "name": "Core Brand",
        "logo_asset_id": None,
        "primary_colors": [],
        "secondary_colors": [],
        "font_heading": None,
        "font_body": None,
        "tone_keywords": [],
        "cta_defaults": None,
        "caption_style_defaults": None,
        "motion_intensity": "medium",
        "transition_family": None,
        "intro_module_enabled": True,
        "outro_module_enabled": True,
        "is_default": True,
        "revision": 1,
        "created_at": "2026-07-05T00:00:00+00:00",
        "updated_at": "2026-07-05T00:00:00+00:00",
    }

    monkeypatch.setattr(router, "brand_profile_store", fake_store)

    with pytest.raises(HTTPException) as error:
        await router.delete_brand_profile("brand-1", current_user=_CurrentUser())

    assert error.value.status_code == status.HTTP_409_CONFLICT
    assert (
        error.value.detail
        == "Set another brand profile as default before deleting this one."
    )

from fastapi import HTTPException

from api.models.brand_video_blueprint import (
    BrandVideoBlueprintCreateRequest,
    BrandVideoBlueprintUpdateRequest,
)
from api.routers import brand_video_blueprints as router


class _CurrentUser:
    user_id = "user-1"


class _FakeBlueprintStore:
    def __init__(self) -> None:
        self.records: dict[str, dict] = {}

    async def list_brand_video_blueprints(self, *, user_id: str, project_id: str, brand_profile_id: str | None = None):
        items = [
            item for item in self.records.values()
            if item["user_id"] == user_id and item["project_id"] == project_id
        ]
        if brand_profile_id is not None:
            items = [item for item in items if item["brand_profile_id"] == brand_profile_id]
        return items

    async def create_brand_video_blueprint(self, *, user_id: str, payload: dict):
        item = {
            "id": "bp-1",
            "user_id": user_id,
            "project_id": payload["project_id"],
            "brand_profile_id": payload["brand_profile_id"],
            "name": payload["name"],
            "status": payload.get("status", "draft"),
            "default_archetype": payload.get("default_archetype", "ugc_ad"),
            "scene_rules_json": payload.get("scene_rules_json") or {},
            "layout_rules_json": payload.get("layout_rules_json") or {},
            "motion_rules_json": payload.get("motion_rules_json") or {},
            "caption_rules_json": payload.get("caption_rules_json") or {},
            "cta_rules_json": payload.get("cta_rules_json") or {},
            "audio_rules_json": payload.get("audio_rules_json") or {},
            "export_rules_json": payload.get("export_rules_json") or {},
            "allowed_regeneration_locks_json": payload.get("allowed_regeneration_locks_json") or {},
            "revision": 1,
            "created_at": "2026-07-05T00:00:00+00:00",
            "updated_at": "2026-07-05T00:00:00+00:00",
        }
        self.records[item["id"]] = item
        return item

    async def get_brand_video_blueprint(self, *, blueprint_id: str, user_id: str):
        item = self.records.get(blueprint_id)
        if not item or item["user_id"] != user_id:
            return None
        return item

    async def update_brand_video_blueprint(self, *, blueprint_id: str, user_id: str, payload: dict):
        item = await self.get_brand_video_blueprint(blueprint_id=blueprint_id, user_id=user_id)
        if item is None:
            return None
        item.update(payload)
        item["revision"] += 1
        return item

    async def delete_brand_video_blueprint(self, *, blueprint_id: str, user_id: str):
        item = await self.get_brand_video_blueprint(blueprint_id=blueprint_id, user_id=user_id)
        if item is None:
            return False
        del self.records[blueprint_id]
        return True


class _FakeBrandProfileStore:
    async def get_brand_profile(self, *, brand_profile_id: str, user_id: str):
        if user_id != "user-1":
            return None
        if brand_profile_id == "wrong-project":
            return {"id": brand_profile_id, "user_id": user_id, "project_id": "project-2"}
        return {"id": brand_profile_id, "user_id": user_id, "project_id": "project-1"}


async def _fake_require_owned_project_id(project_id: str, current_user):
    assert current_user.user_id == "user-1"
    if project_id != "project-1":
        raise HTTPException(status_code=404, detail="Project not found")
    return project_id


async def test_brand_video_blueprints_router_crud(monkeypatch):
    fake_store = _FakeBlueprintStore()
    monkeypatch.setattr(router, "brand_video_blueprint_store", fake_store)
    monkeypatch.setattr(router, "brand_profile_store", _FakeBrandProfileStore())
    monkeypatch.setattr(router, "require_owned_project_id", _fake_require_owned_project_id)

    created = await router.create_brand_video_blueprint(
        BrandVideoBlueprintCreateRequest(
            projectId="project-1",
            brandProfileId="profile-1",
            name="Brand Engine",
            status="active",
        ),
        current_user=_CurrentUser(),
    )
    assert created.project_id == "project-1"
    assert created.brand_profile_id == "profile-1"

    listed = await router.list_brand_video_blueprints(
        projectId="project-1",
        brandProfileId="profile-1",
        current_user=_CurrentUser(),
    )
    assert len(listed) == 1

    loaded = await router.get_brand_video_blueprint("bp-1", current_user=_CurrentUser())
    assert loaded.id == "bp-1"

    updated = await router.update_brand_video_blueprint(
        "bp-1",
        BrandVideoBlueprintUpdateRequest(defaultArchetype="product_demo"),
        current_user=_CurrentUser(),
    )
    assert updated.default_archetype == "product_demo"
    assert updated.revision == 2

    await router.delete_brand_video_blueprint("bp-1", current_user=_CurrentUser())
    assert fake_store.records == {}


async def test_brand_video_blueprints_router_rejects_cross_project_brand_profile(monkeypatch):
    monkeypatch.setattr(router, "brand_video_blueprint_store", _FakeBlueprintStore())
    monkeypatch.setattr(router, "brand_profile_store", _FakeBrandProfileStore())
    monkeypatch.setattr(router, "require_owned_project_id", _fake_require_owned_project_id)

    try:
        await router.create_brand_video_blueprint(
            BrandVideoBlueprintCreateRequest(
                projectId="project-1",
                brandProfileId="wrong-project",
                name="Bad Ref",
            ),
            current_user=_CurrentUser(),
        )
    except HTTPException as exc:
        assert exc.status_code == 409
        assert exc.detail == "Brand profile does not belong to the requested project"
    else:
        raise AssertionError("Expected HTTPException")

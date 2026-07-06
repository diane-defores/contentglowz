from utils.libsql_async import create_client

from api.services.brand_video_blueprint_store import BrandVideoBlueprintStore


async def test_brand_video_blueprint_store_crud(tmp_path):
    db_path = tmp_path / "brand-video-blueprints.db"
    client = create_client(url=f"file:{db_path}")
    store = BrandVideoBlueprintStore(db_client=client)

    await store.ensure_tables()

    created = await store.create_brand_video_blueprint(
        user_id="user-1",
        payload={
            "project_id": "project-1",
            "brand_profile_id": "profile-1",
            "name": "Launch Vertical",
            "status": "active",
            "default_archetype": "ugc_ad",
            "scene_rules_json": {"hook": {"maxSeconds": 3}},
        },
    )
    assert created["project_id"] == "project-1"
    assert created["brand_profile_id"] == "profile-1"
    assert created["scene_rules_json"]["hook"]["maxSeconds"] == 3
    assert created["revision"] == 1

    listed = await store.list_brand_video_blueprints(user_id="user-1", project_id="project-1")
    assert len(listed) == 1

    filtered = await store.list_brand_video_blueprints(
        user_id="user-1",
        project_id="project-1",
        brand_profile_id="profile-1",
    )
    assert len(filtered) == 1

    updated = await store.update_brand_video_blueprint(
        blueprint_id=created["id"],
        user_id="user-1",
        payload={
            "brand_profile_id": "profile-2",
            "default_archetype": "product_demo",
            "allowed_regeneration_locks_json": {"preserve": ["cta_copy"]},
        },
    )
    assert updated is not None
    assert updated["brand_profile_id"] == "profile-2"
    assert updated["default_archetype"] == "product_demo"
    assert updated["allowed_regeneration_locks_json"]["preserve"] == ["cta_copy"]
    assert updated["revision"] == 2

    deleted = await store.delete_brand_video_blueprint(
        blueprint_id=created["id"],
        user_id="user-1",
    )
    assert deleted is True

    missing = await store.get_brand_video_blueprint(
        blueprint_id=created["id"],
        user_id="user-1",
    )
    assert missing is None

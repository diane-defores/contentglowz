import pytest

from api.services.brand_profile_store import BrandProfileStore
from utils.libsql_async import create_client


@pytest.mark.asyncio
async def test_brand_profile_store_crud_and_default_switching(tmp_path):
    db_path = tmp_path / "brand-profiles.db"
    client = create_client(url=f"file:{db_path}")
    store = BrandProfileStore(db_client=client)
    await store.ensure_tables()

    first = await store.create_brand_profile(
        user_id="user-1",
        payload={
            "project_id": "project-1",
            "name": "Primary",
            "primary_colors": ["#111111"],
            "motion_intensity": "medium",
            "is_default": True,
        },
    )
    second = await store.create_brand_profile(
        user_id="user-1",
        payload={
            "project_id": "project-1",
            "name": "Secondary",
            "secondary_colors": ["#222222"],
            "motion_intensity": "high",
            "is_default": True,
        },
    )

    listed = await store.list_brand_profiles(user_id="user-1", project_id="project-1")
    assert len(listed) == 2
    assert listed[0]["id"] == second["id"]
    assert listed[0]["is_default"] is True
    assert listed[1]["is_default"] is False

    updated = await store.update_brand_profile(
        brand_profile_id=first["id"],
        user_id="user-1",
        payload={
            "name": "Primary Updated",
            "is_default": True,
            "tone_keywords": ["direct", "clean"],
        },
    )
    assert updated is not None
    assert updated["name"] == "Primary Updated"
    assert updated["revision"] == 2
    assert updated["is_default"] is True
    assert updated["tone_keywords"] == ["direct", "clean"]

    after_switch = await store.list_brand_profiles(user_id="user-1", project_id="project-1")
    switched = {profile["id"]: profile for profile in after_switch}
    assert switched[first["id"]]["is_default"] is True
    assert switched[second["id"]]["is_default"] is False

    deleted = await store.delete_brand_profile(
        brand_profile_id=second["id"],
        user_id="user-1",
    )
    assert deleted is True
    assert await store.get_brand_profile(brand_profile_id=second["id"], user_id="user-1") is None

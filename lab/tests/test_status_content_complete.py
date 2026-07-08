from types import SimpleNamespace

import pytest

from api.dependencies.auth import CurrentUser
from api.routers import status as router


class _FakeStatusService:
    def __init__(self):
        self.updated = {}

    def update_content(self, content_id: str, **updates):
        record = self.updated.get(content_id)
        if record is None:
            record = SimpleNamespace(
                id=content_id,
                title="Video draft",
                content_type="video_script",
                source_robot="manual",
                status="approved",
                project_id="project-1",
                user_id="user-1",
                content_path=None,
                content_preview="Preview",
                content_hash=None,
                priority=3,
                tags=[],
                metadata={"existing": True},
                target_url=None,
                reviewer_note=None,
                reviewed_by=None,
                review_actor_type=None,
                review_actor_id=None,
                review_actor_label=None,
                review_actor_metadata=None,
                created_at="2026-07-08T00:00:00+00:00",
                updated_at="2026-07-08T00:00:00+00:00",
                scheduled_for=None,
                published_at=None,
                synced_at=None,
            )
        for key, value in updates.items():
            setattr(record, key, value)
        self.updated[content_id] = record
        return record


@pytest.mark.asyncio
async def test_complete_content_marks_metadata(monkeypatch):
    fake_svc = _FakeStatusService()

    async def _require_owned_content_record(content_id, current_user, status_service):
        assert content_id == "content-1"
        assert current_user.user_id == "user-1"
        return SimpleNamespace(
            id="content-1",
            title="Video draft",
            content_type="video_script",
            source_robot="manual",
            status="approved",
            project_id="project-1",
            user_id="user-1",
            content_path=None,
            content_preview="Preview",
            content_hash=None,
            priority=3,
            tags=[],
            metadata={"existing": True},
            target_url=None,
            reviewer_note=None,
            reviewed_by=None,
            review_actor_type=None,
            review_actor_id=None,
            review_actor_label=None,
            review_actor_metadata=None,
            created_at="2026-07-08T00:00:00+00:00",
            updated_at="2026-07-08T00:00:00+00:00",
            scheduled_for=None,
            published_at=None,
            synced_at=None,
        )

    monkeypatch.setattr(router, "get_status_service", lambda: fake_svc)
    monkeypatch.setattr(router, "require_owned_content_record", _require_owned_content_record)

    response = await router.complete_content("content-1", current_user=CurrentUser(user_id="user-1", email=None, bearer_token="t"))

    assert response.metadata["content_complete"] is True
    assert response.metadata["content_complete_at"]
    assert response.metadata["video_generation_state"] == "ready"

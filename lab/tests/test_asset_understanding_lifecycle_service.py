import sqlite3

import pytest

from api.services.asset_understanding import AssetUnderstandingError
from status.service import ContentNotFoundError


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


def _create_asset_for(status_service, *, project_id="project-1", user_id="user-1"):
    content = status_service.create_content(
        title="Draft title",
        content_type="article",
        source_robot="manual",
        status="pending_review",
        project_id=project_id,
        user_id=user_id,
        content_preview="Preview",
    )
    content_asset = status_service.create_content_asset(
        content_id=content.id,
        project_id=project_id,
        user_id=user_id,
        kind="image",
        mime_type="image/png",
        storage_uri="bunny://zone/path",
        status="uploaded",
    )
    return next(
        asset
        for asset in status_service.list_project_assets(project_id=project_id, user_id=user_id)
        if asset.content_asset_id == content_asset.id
    )


def _create_asset(status_service):
    return _create_asset_for(status_service)


def test_queue_job_is_idempotent(monkeypatch, status_service):
    asset = _create_asset(status_service)
    monkeypatch.setenv("GEMINI_API_KEY", "platform-key")

    async def _status(_user_id, *, provider):
        return None

    async def _secret(_user_id, *, provider):
        return None

    monkeypatch.setattr("api.services.asset_understanding.user_key_store.get_credential_status", _status)
    monkeypatch.setattr("api.services.asset_understanding.user_key_store.get_secret", _secret)

    first = status_service.queue_asset_understanding_job(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset.id,
        idempotency_key="idem-a",
    )
    second = status_service.queue_asset_understanding_job(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset.id,
        idempotency_key="idem-a",
    )
    assert first.id == second.id
    assert first.credential_source == "platform"


def test_queue_job_blocked_when_provider_not_configured(monkeypatch, status_service):
    asset = _create_asset(status_service)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    async def _status(_user_id, *, provider):
        return None

    async def _secret(_user_id, *, provider):
        return None

    monkeypatch.setattr("api.services.asset_understanding.user_key_store.get_credential_status", _status)
    monkeypatch.setattr("api.services.asset_understanding.user_key_store.get_secret", _secret)

    job = status_service.queue_asset_understanding_job(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset.id,
        idempotency_key="idem-b",
    )
    assert job.status == "blocked"
    assert job.error_code == "provider_not_configured"


def test_execute_job_success_and_persists_result(monkeypatch, status_service):
    asset = _create_asset(status_service)
    monkeypatch.setenv("GEMINI_API_KEY", "platform-key")

    async def _status(_user_id, *, provider):
        return None

    async def _secret(_user_id, *, provider):
        return None

    class _Adapter:
        provider_name = "gemini_compatible"

        async def analyze_image(self, *, media, prompt_context):
            return {
                "summary": "Deer jumping",
                "tags": [{"key": "deer", "label": "Deer", "confidence": 0.8}],
                "segments": [],
                "source_attribution": {"rights_status": "unknown"},
            }

        async def analyze_video(self, *, media, prompt_context):
            raise AssertionError("unexpected video path")

    monkeypatch.setattr("api.services.asset_understanding.user_key_store.get_credential_status", _status)
    monkeypatch.setattr("api.services.asset_understanding.user_key_store.get_secret", _secret)

    job = status_service.queue_asset_understanding_job(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset.id,
        idempotency_key="idem-success",
    )
    done = status_service.execute_asset_understanding_job(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset.id,
        job_id=job.id,
        adapter=_Adapter(),
    )
    assert done.status == "completed"
    status = status_service.get_latest_asset_understanding_status(project_id="project-1", user_id="user-1", asset_id=asset.id)
    assert status["result"] is not None
    assert status["result"].tags[0].label == "Deer"


def test_execute_job_failure_and_retry_cap(monkeypatch, status_service):
    asset = _create_asset(status_service)
    monkeypatch.setenv("GEMINI_API_KEY", "platform-key")
    monkeypatch.setenv("ASSET_UNDERSTANDING_MAX_RETRIES", "1")

    async def _status(_user_id, *, provider):
        return None

    async def _secret(_user_id, *, provider):
        return None

    class _Adapter:
        provider_name = "gemini_compatible"

        async def analyze_image(self, *, media, prompt_context):
            raise AssetUnderstandingError(code="provider_timeout", message="timeout", retryable=True)

        async def analyze_video(self, *, media, prompt_context):
            raise AssertionError("unexpected video path")

    monkeypatch.setattr("api.services.asset_understanding.user_key_store.get_credential_status", _status)
    monkeypatch.setattr("api.services.asset_understanding.user_key_store.get_secret", _secret)

    job = status_service.queue_asset_understanding_job(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset.id,
        idempotency_key="idem-fail",
    )
    failed = status_service.execute_asset_understanding_job(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset.id,
        job_id=job.id,
        adapter=_Adapter(),
    )
    assert failed.status == "failed"
    with pytest.raises(ValueError, match="Retry limit reached"):
        status_service.retry_asset_understanding_job(
            project_id="project-1",
            user_id="user-1",
            asset_id=asset.id,
            job_id=job.id,
        )


def test_tag_moderation_and_preservation_on_reanalysis(monkeypatch, status_service):
    asset = _create_asset(status_service)
    monkeypatch.setenv("GEMINI_API_KEY", "platform-key")

    async def _status(_user_id, *, provider):
        return None

    async def _secret(_user_id, *, provider):
        return None

    monkeypatch.setattr("api.services.asset_understanding.user_key_store.get_credential_status", _status)
    monkeypatch.setattr("api.services.asset_understanding.user_key_store.get_secret", _secret)

    job1 = status_service.queue_asset_understanding_job(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset.id,
        idempotency_key="idem-mod-1",
    )
    status_service.save_asset_understanding_result(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset.id,
        job_id=job1.id,
        provider_payload={
            "summary": "A",
            "tags": [{"key": "deer", "label": "Deer", "confidence": 0.8}],
            "segments": [],
            "source_attribution": {"rights_status": "unknown"},
        },
    )
    status_service.moderate_asset_understanding_tags(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset.id,
        decisions=[{"action": "accept", "key": "deer", "label": "Deer"}],
        manual_tags=["Fast Motion"],
    )
    job2 = status_service.queue_asset_understanding_job(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset.id,
        idempotency_key="idem-mod-2",
    )
    result2 = status_service.save_asset_understanding_result(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset.id,
        job_id=job2.id,
        provider_payload={
            "summary": "B",
            "tags": [{"key": "deer", "label": "Deer", "confidence": 0.7}],
            "segments": [],
            "source_attribution": {"rights_status": "unknown"},
        },
    )
    deer = next(tag for tag in result2.tags if tag.key == "deer")
    assert deer.accepted_by_user is True


def test_recommendation_warnings_and_placements(monkeypatch, status_service):
    asset = _create_asset(status_service)
    monkeypatch.setenv("GEMINI_API_KEY", "platform-key")

    async def _status(_user_id, *, provider):
        return None

    async def _secret(_user_id, *, provider):
        return None

    monkeypatch.setattr("api.services.asset_understanding.user_key_store.get_credential_status", _status)
    monkeypatch.setattr("api.services.asset_understanding.user_key_store.get_secret", _secret)

    job = status_service.queue_asset_understanding_job(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset.id,
        idempotency_key="idem-reco",
    )
    status_service.save_asset_understanding_result(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset.id,
        job_id=job.id,
        provider_payload={
            "summary": "Clip",
            "tags": [
                {"key": "illustration", "label": "Illustration", "confidence": 0.8},
                {"key": "thumbnail_candidate", "label": "Thumbnail", "confidence": 0.6},
            ],
            "segments": [],
            "source_attribution": {"rights_status": "unknown", "credit_required": True},
        },
    )
    items = status_service.recommend_project_assets_for_brief(
        project_id="project-1",
        user_id="user-1",
        desired_tags=["illustration"],
    )
    assert items[0]["warnings"] == ["credit_required"]
    assert "illustration" in items[0]["suggested_placements"]


def test_execute_respects_concurrency_cap(monkeypatch, status_service):
    asset1 = _create_asset(status_service)
    asset2 = _create_asset(status_service)
    monkeypatch.setenv("GEMINI_API_KEY", "platform-key")
    monkeypatch.setenv("ASSET_UNDERSTANDING_CONCURRENCY_PER_PROJECT", "1")

    async def _status(_user_id, *, provider):
        return None

    async def _secret(_user_id, *, provider):
        return None

    monkeypatch.setattr("api.services.asset_understanding.user_key_store.get_credential_status", _status)
    monkeypatch.setattr("api.services.asset_understanding.user_key_store.get_secret", _secret)

    job1 = status_service.queue_asset_understanding_job(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset1.id,
        idempotency_key="idem-c1",
    )
    status_service._conn.execute("UPDATE asset_understanding_jobs SET status = 'running' WHERE id = ?", (job1.id,))
    status_service._conn.commit()
    job2 = status_service.queue_asset_understanding_job(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset2.id,
        idempotency_key="idem-c2",
    )
    outcome = status_service.execute_asset_understanding_job(
        project_id="project-1",
        user_id="user-1",
        asset_id=asset2.id,
        job_id=job2.id,
    )
    assert outcome.status == "queued"


def test_recommendation_global_candidates_are_opt_in_and_scoped(monkeypatch, status_service):
    local_asset = _create_asset_for(status_service, project_id="project-1", user_id="user-1")
    global_asset = _create_asset_for(status_service, project_id="project-2", user_id="user-1")
    _create_asset_for(status_service, project_id="project-9", user_id="user-2")
    monkeypatch.setenv("GEMINI_API_KEY", "platform-key")

    async def _status(_user_id, *, provider):
        return None

    async def _secret(_user_id, *, provider):
        return None

    monkeypatch.setattr("api.services.asset_understanding.user_key_store.get_credential_status", _status)
    monkeypatch.setattr("api.services.asset_understanding.user_key_store.get_secret", _secret)

    local_job = status_service.queue_asset_understanding_job(
        project_id="project-1", user_id="user-1", asset_id=local_asset.id, idempotency_key="idem-local-reco"
    )
    status_service.save_asset_understanding_result(
        project_id="project-1",
        user_id="user-1",
        asset_id=local_asset.id,
        job_id=local_job.id,
        provider_payload={"summary": "local", "tags": [{"key": "deer", "label": "Deer", "confidence": 0.9}]},
    )

    global_job = status_service.queue_asset_understanding_job(
        project_id="project-2", user_id="user-1", asset_id=global_asset.id, idempotency_key="idem-global-reco"
    )
    status_service.save_asset_understanding_result(
        project_id="project-2",
        user_id="user-1",
        asset_id=global_asset.id,
        job_id=global_job.id,
        provider_payload={"summary": "global", "tags": [{"key": "deer", "label": "Deer", "confidence": 0.8}]},
    )

    no_global = status_service.recommend_project_assets_for_brief(
        project_id="project-1", user_id="user-1", desired_tags=["deer"], include_global_candidates=False
    )
    assert all(item["candidate_type"] == "attached_project_asset" for item in no_global)

    with_global = status_service.recommend_project_assets_for_brief(
        project_id="project-1", user_id="user-1", desired_tags=["deer"], include_global_candidates=True
    )
    global_candidates = [item for item in with_global if item["candidate_type"] == "candidate_global_asset"]
    assert len(global_candidates) == 1
    assert global_candidates[0]["asset_id"] == global_asset.id
    assert global_candidates[0]["requires_project_attachment"] is True
    assert global_candidates[0]["source_project_id"] == "project-2"


def test_attach_global_asset_is_required_before_project_usage(status_service):
    content = status_service.create_content(
        title="Brief",
        content_type="article",
        source_robot="manual",
        status="pending_review",
        project_id="project-1",
        user_id="user-1",
        content_preview="Preview",
    )
    global_asset = _create_asset_for(status_service, project_id="project-2", user_id="user-1")

    with pytest.raises(ContentNotFoundError):
        status_service.select_project_asset(
            project_id="project-1",
            user_id="user-1",
            asset_id=global_asset.id,
            target_type="content",
            target_id=content.id,
            usage_action="select_for_content",
        )

    attached = status_service.attach_global_project_asset(
        project_id="project-1",
        user_id="user-1",
        global_asset_id=global_asset.id,
    )
    usage = status_service.select_project_asset(
        project_id="project-1",
        user_id="user-1",
        asset_id=attached.id,
        target_type="content",
        target_id=content.id,
        usage_action="select_for_content",
    )
    assert usage.asset_id == attached.id
    assert attached.source_asset_id == global_asset.id

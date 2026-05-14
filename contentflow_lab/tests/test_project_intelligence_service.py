from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

import api.services.project_intelligence_service as service_module
from api.services.project_intelligence_service import (
    ProjectIntelligenceService,
    UploadPayload,
)
from api.services.project_intelligence_store import ProjectIntelligenceStore
from utils.libsql_async import create_client


@pytest.mark.asyncio
async def test_project_intelligence_service_ingest_uploads_dedupes_on_retry(monkeypatch):
    store = ProjectIntelligenceStore(db_client=create_client(url=":memory:"))
    await store.ensure_tables()
    svc = ProjectIntelligenceService(store=store)
    monkeypatch.setattr(
        service_module.ai_runtime_service,
        "preflight_providers",
        AsyncMock(),
    )

    payload = UploadPayload(
        file_name="plan.md",
        content_type="text/markdown",
        body=b"Audience, SEO and offer constraints.",
    )
    first = await svc.ingest_uploads(
        user_id="user-1",
        project_id="project-1",
        uploads=[payload],
    )
    second = await svc.ingest_uploads(
        user_id="user-1",
        project_id="project-1",
        uploads=[payload],
    )

    assert first["accepted"] == 1
    assert first["duplicated"] == 0
    assert second["accepted"] == 1
    assert second["duplicated"] == 1


@pytest.mark.asyncio
async def test_project_intelligence_service_add_to_idea_pool_reuses_existing(monkeypatch):
    store = ProjectIntelligenceStore(db_client=create_client(url=":memory:"))
    await store.ensure_tables()
    svc = ProjectIntelligenceService(store=store)
    await store.upsert_recommendations(
        [
            {
                "userId": "user-1",
                "projectId": "project-1",
                "recommendationKey": "stable-rec",
                "recommendationType": "idea_candidate",
                "title": "Promote signal",
                "summary": "Strong fact",
                "priority": 1,
                "confidence": 0.9,
                "status": "open",
                "evidenceIds": ["s1"],
                "evidence": [{"sourceId": "s1"}],
                "metadata": {"deterministic": True},
            }
        ]
    )
    recommendations = await store.list_recommendations(user_id="user-1", project_id="project-1")
    recommendation_id = recommendations[0]["id"]

    class _FakeStatusService:
        def list_ideas(self, **kwargs):
            del kwargs
            return (
                [
                    {
                        "id": "idea-1",
                        "raw_data": {"recommendation_key": "stable-rec"},
                    }
                ],
                1,
            )

        def create_idea(self, **kwargs):
            del kwargs
            raise AssertionError("create_idea should not be called when recommendation is already present")

    monkeypatch.setattr(service_module, "get_status_service", lambda: _FakeStatusService())

    result = await svc.add_recommendation_to_idea_pool(
        user_id="user-1",
        project_id="project-1",
        recommendation_id=recommendation_id,
    )
    assert result["action"] == "reused"
    assert result["ideaId"] == "idea-1"


@pytest.mark.asyncio
async def test_project_intelligence_service_provider_readiness_shape():
    store = ProjectIntelligenceStore(db_client=create_client(url=":memory:"))
    await store.ensure_tables()
    svc = ProjectIntelligenceService(store=store)

    readiness = await svc.provider_readiness(user_id="user-1", project_id="project-1")
    assert readiness["projectId"] == "project-1"
    assert readiness["readiness"] in {"needs_evidence", "curation_in_progress", "rag_ready"}

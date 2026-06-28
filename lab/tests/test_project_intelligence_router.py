from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from api.routers import project_intelligence as router


class _FakeUpload:
    def __init__(self, filename: str, content_type: str, body: bytes) -> None:
        self.filename = filename
        self.content_type = content_type
        self._body = body

    async def read(self) -> bytes:
        return self._body


def _job_dict() -> dict:
    now = datetime.now(timezone.utc)
    return {
        "id": "job-1",
        "userId": "user-1",
        "projectId": "project-1",
        "jobType": "project_intelligence.ingest",
        "status": "completed",
        "summary": {"accepted": 1},
        "createdAt": now,
        "updatedAt": now,
        "startedAt": now,
        "completedAt": now,
    }


def test_project_intelligence_router_exposes_expected_paths():
    routes = {(route.path, frozenset(route.methods or set())) for route in router.router.routes}
    assert ("/api/projects/{project_id}/intelligence/status", frozenset({"GET"})) in routes
    assert ("/api/projects/{project_id}/intelligence/upload", frozenset({"POST"})) in routes
    assert ("/api/projects/{project_id}/intelligence/sync", frozenset({"POST"})) in routes
    assert ("/api/projects/{project_id}/intelligence/sources/{source_id}", frozenset({"DELETE"})) in routes
    assert (
        "/api/projects/{project_id}/intelligence/recommendations/{recommendation_id}/idea-pool",
        frozenset({"POST"}),
    ) in routes


@pytest.mark.asyncio
async def test_upload_sources_rejects_more_than_max_files(monkeypatch):
    monkeypatch.setattr(
        router,
        "require_owned_project",
        AsyncMock(return_value=SimpleNamespace(id="project-1")),
    )
    files = [_FakeUpload(f"f{i}.md", "text/markdown", b"hello") for i in range(11)]
    with pytest.raises(HTTPException) as exc:
        await router.upload_sources(
            project_id="project-1",
            files=files,
            include_ai_synthesis=False,
            current_user=SimpleNamespace(user_id="user-1"),
        )
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_upload_sources_merges_pre_validation_errors(monkeypatch):
    monkeypatch.setattr(
        router,
        "require_owned_project",
        AsyncMock(return_value=SimpleNamespace(id="project-1")),
    )
    monkeypatch.setattr(
        router.project_intelligence_service,
        "ingest_uploads",
        AsyncMock(
            return_value={
                "projectId": "project-1",
                "job": _job_dict(),
                "accepted": 1,
                "failed": 0,
                "duplicated": 0,
                "errors": [],
            }
        ),
    )
    files = [
        _FakeUpload("ok.md", "text/markdown", b"Audience signal"),
        _FakeUpload("bad.pdf", "application/pdf", b"%PDF"),
    ]
    response = await router.upload_sources(
        project_id="project-1",
        files=files,
        include_ai_synthesis=False,
        current_user=SimpleNamespace(user_id="user-1"),
    )
    assert response.accepted == 1
    assert response.failed == 1
    assert len(response.errors) == 1


@pytest.mark.asyncio
async def test_add_recommendation_to_idea_pool_maps_missing_to_404(monkeypatch):
    monkeypatch.setattr(
        router,
        "require_owned_project",
        AsyncMock(return_value=SimpleNamespace(id="project-1")),
    )
    monkeypatch.setattr(
        router.project_intelligence_service,
        "add_recommendation_to_idea_pool",
        AsyncMock(side_effect=RuntimeError("Recommendation not found")),
    )
    with pytest.raises(HTTPException) as exc:
        await router.add_recommendation_to_idea_pool(
            project_id="project-1",
            recommendation_id="rec-404",
            current_user=SimpleNamespace(user_id="user-1"),
        )
    assert exc.value.status_code == 404

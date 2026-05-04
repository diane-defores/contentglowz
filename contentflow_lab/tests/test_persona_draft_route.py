import importlib.util
import sys
import types
from contextlib import nullcontext
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock

import httpx
import pytest
from fastapi import HTTPException

from api.models.persona_draft import PersonaDraftRequest
from api.models.persona_draft import RepoUnderstandingResult
import api.services.repo_understanding_service as repo_understanding_module

_PERSONAS_ROUTER_PATH = Path(__file__).resolve().parent.parent / "api" / "routers" / "personas.py"


def _load_personas_router_module():
    sys.modules.setdefault(
        "api.dependencies.auth",
        types.SimpleNamespace(CurrentUser=object, require_current_user=lambda: None),
    )
    spec = importlib.util.spec_from_file_location("contentflow_lab_personas_router", _PERSONAS_ROUTER_PATH)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.mark.asyncio
async def test_persona_draft_blank_form_queues_job_without_llm_key(monkeypatch):
    personas_router = _load_personas_router_module()
    monkeypatch.setattr(personas_router.job_store, "upsert", AsyncMock())
    monkeypatch.setattr(personas_router.user_llm_service, "get_openrouter_key", AsyncMock())

    def _fake_create_task(coro):
        coro.close()
        return None

    monkeypatch.setattr(personas_router.asyncio, "create_task", _fake_create_task)

    response = await personas_router.create_persona_draft(
        request=PersonaDraftRequest(
            repo_source="project_repo",
            project_id="project-1",
            mode="blank_form",
        ),
        current_user=SimpleNamespace(user_id="user-1"),
    )

    assert response.status == "pending"
    personas_router.user_llm_service.get_openrouter_key.assert_not_called()


@pytest.mark.asyncio
async def test_persona_draft_requires_openrouter_key_outside_blank_mode(monkeypatch):
    personas_router = _load_personas_router_module()
    monkeypatch.setattr(
        personas_router.user_llm_service,
        "get_openrouter_key",
        AsyncMock(side_effect=RuntimeError("missing key")),
    )

    with pytest.raises(HTTPException) as exc:
        await personas_router.create_persona_draft(
            request=PersonaDraftRequest(
                repo_source="manual_url",
                manual_url="https://example.com",
                mode="suggest_from_repo",
            ),
            current_user=SimpleNamespace(user_id="user-1"),
        )

    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_persona_draft_project_repo_success_stores_completed_result(monkeypatch):
    personas_router = _load_personas_router_module()
    monkeypatch.setattr(
        personas_router.ai_runtime_service,
        "preflight_providers",
        AsyncMock(
            return_value=SimpleNamespace(
                required_provider_secrets={"openrouter": "k"},
            )
        ),
    )
    monkeypatch.setattr(
        personas_router.ai_runtime_service,
        "bind_provider_env",
        lambda _resolution: nullcontext(),
    )
    update_mock = AsyncMock()
    monkeypatch.setattr(personas_router.job_store, "update", update_mock)
    monkeypatch.setattr(
        personas_router.repo_understanding_service,
        "understand",
        AsyncMock(
            return_value=RepoUnderstandingResult(
                project_summary="summary",
                evidence=[{"source": "local_repo", "location": "README.md", "snippet": "saas"}],
                persona_candidates=[
                    {
                        "name": "Founder Persona",
                        "demographics": {"role": "Founder", "industry": "B2B SaaS"},
                        "pain_points": ["No pipeline"],
                        "goals": ["Steady demand"],
                    }
                ],
            )
        ),
    )
    monkeypatch.setattr(personas_router.user_llm_service, "get_openrouter_key", AsyncMock(return_value="k"))
    monkeypatch.setattr(
        personas_router.user_data_store,
        "get_creator_profile",
        AsyncMock(
            return_value={
                "displayName": "Lya",
                "voice": {"tone": "clear"},
                "positioning": {"angle": "practical"},
                "values": ["clarity", "speed"],
            }
        ),
    )
    monkeypatch.setattr(
        personas_router.repo_understanding_service,
        "build_persona_draft",
        lambda understanding, creator_profile=None: {
            "name": "Founder Persona",
            "pain_points": ["No pipeline"],
            "goals": ["Steady demand"],
            "confidence": 72,
        },
    )

    await personas_router._run_persona_draft_job(
        job_id="job-1",
        user_id="user-1",
        request=PersonaDraftRequest(
            repo_source="project_repo",
            project_id="project-1",
            mode="suggest_from_repo",
        ),
    )

    assert update_mock.await_count >= 3
    last_call = update_mock.await_args_list[-1]
    assert last_call.args[0] == "job-1"
    assert last_call.kwargs["status"] == "completed"
    assert last_call.kwargs["result"]["confidence"] == 72


@pytest.mark.asyncio
async def test_persona_draft_job_status_is_owner_scoped(monkeypatch):
    personas_router = _load_personas_router_module()
    monkeypatch.setattr(
        personas_router.job_store,
        "get",
        AsyncMock(
            return_value={
                "job_id": "job-1",
                "job_type": "personas.draft",
                "status": "running",
                "user_id": "owner",
            }
        ),
    )

    with pytest.raises(HTTPException) as exc:
        await personas_router.get_persona_draft_job(
            job_id="job-1",
            current_user=SimpleNamespace(user_id="not-owner"),
        )

    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_repo_understanding_uses_connected_github_source(monkeypatch):
    monkeypatch.setattr(
        repo_understanding_module.user_data_store,
        "get_github_integration",
        AsyncMock(return_value={"token": "gh-token"}),
    )
    monkeypatch.setattr(
        repo_understanding_module.repo_understanding_service,
        "_collect_github_repo",
        AsyncMock(return_value=("repo content", [])),
    )
    monkeypatch.setattr(
        repo_understanding_module.repo_understanding_service,
        "_synthesize_understanding",
        AsyncMock(return_value=RepoUnderstandingResult(project_summary="summary")),
    )

    result = await repo_understanding_module.repo_understanding_service.understand(
        "user-1",
        PersonaDraftRequest(
            repo_source="connected_github",
            repo_url="https://github.com/acme/repo",
        ),
    )

    assert result.project_summary == "summary"


@pytest.mark.asyncio
async def test_repo_understanding_synthesis_uses_pydantic_ai_adapter(monkeypatch):
    captured: dict[str, object] = {}

    async def fake_run_openrouter_structured(user_id, **kwargs):
        captured["user_id"] = user_id
        captured.update(kwargs)
        return RepoUnderstandingResult(
            project_summary="typed summary",
            target_audiences=["founders"],
        )

    monkeypatch.setattr(
        repo_understanding_module.pydantic_ai_runtime,
        "run_openrouter_structured",
        fake_run_openrouter_structured,
    )

    result = await repo_understanding_module.repo_understanding_service._synthesize_understanding(
        "user-1",
        content="README content",
        evidence=[
            repo_understanding_module.EvidenceItem(
                source="local_repo",
                location="README.md",
                snippet="README content",
            )
        ],
        request=PersonaDraftRequest(
            repo_source="project_repo",
            project_id="project-1",
            mode="suggest_from_repo",
        ),
    )

    assert result.project_summary == "typed summary"
    assert result.target_audiences == ["founders"]
    assert result.evidence[0].location == "README.md"
    assert captured["user_id"] == "user-1"
    assert captured["route"] == "personas.draft"
    assert captured["output_type"] is RepoUnderstandingResult


class _FakeAsyncClient:
    def __init__(self, responses):
        self._responses = responses

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return None

    async def get(self, url, headers=None):
        del headers
        response = self._responses.get(url)
        if response is None:
            raise AssertionError(f"Unexpected URL: {url}")
        return response


@pytest.mark.asyncio
async def test_repo_understanding_project_repo_falls_back_to_request_github_url(monkeypatch):
    monkeypatch.setattr(
        repo_understanding_module.project_store,
        "get_by_id",
        AsyncMock(
            return_value=SimpleNamespace(
                user_id="user-1",
                url="https://example.com/not-github",
                settings=SimpleNamespace(local_repo_path=None),
            )
        ),
    )
    monkeypatch.setattr(
        repo_understanding_module.user_data_store,
        "get_github_integration",
        AsyncMock(return_value={"token": "gh-token"}),
    )
    collect_mock = AsyncMock(return_value=("repo content", []))
    monkeypatch.setattr(
        repo_understanding_module.repo_understanding_service,
        "_collect_github_repo",
        collect_mock,
    )
    monkeypatch.setattr(
        repo_understanding_module.repo_understanding_service,
        "_synthesize_understanding",
        AsyncMock(return_value=RepoUnderstandingResult(project_summary="summary")),
    )

    result = await repo_understanding_module.repo_understanding_service.understand(
        "user-1",
        PersonaDraftRequest(
            repo_source="project_repo",
            project_id="project-1",
            repo_url="https://github.com/acme/repo",
            mode="suggest_from_repo",
        ),
    )

    assert result.project_summary == "summary"
    collect_mock.assert_awaited_once_with("https://github.com/acme/repo", token="gh-token")


@pytest.mark.asyncio
async def test_repo_understanding_project_repo_falls_back_to_stored_github_url(monkeypatch):
    monkeypatch.setattr(
        repo_understanding_module.project_store,
        "get_by_id",
        AsyncMock(
            return_value=SimpleNamespace(
                user_id="user-1",
                url="https://github.com/acme/stored-repo",
                settings=SimpleNamespace(local_repo_path=None),
            )
        ),
    )
    monkeypatch.setattr(
        repo_understanding_module.user_data_store,
        "get_github_integration",
        AsyncMock(return_value=None),
    )
    collect_mock = AsyncMock(return_value=("repo content", []))
    monkeypatch.setattr(
        repo_understanding_module.repo_understanding_service,
        "_collect_github_repo",
        collect_mock,
    )
    monkeypatch.setattr(
        repo_understanding_module.repo_understanding_service,
        "_synthesize_understanding",
        AsyncMock(return_value=RepoUnderstandingResult(project_summary="summary")),
    )

    result = await repo_understanding_module.repo_understanding_service.understand(
        "user-1",
        PersonaDraftRequest(
            repo_source="project_repo",
            project_id="project-1",
            mode="suggest_from_repo",
        ),
    )

    assert result.project_summary == "summary"
    collect_mock.assert_awaited_once_with("https://github.com/acme/stored-repo", token=None)


@pytest.mark.asyncio
async def test_repo_understanding_accepts_public_github_manual_url(monkeypatch):
    monkeypatch.setattr(
        repo_understanding_module.repo_understanding_service,
        "_collect_github_repo",
        AsyncMock(return_value=("repo content", [])),
    )
    monkeypatch.setattr(
        repo_understanding_module.repo_understanding_service,
        "_synthesize_understanding",
        AsyncMock(return_value=RepoUnderstandingResult(project_summary="summary")),
    )

    result = await repo_understanding_module.repo_understanding_service.understand(
        "user-1",
        PersonaDraftRequest(
            repo_source="manual_url",
            repo_url="https://github.com/acme/repo",
            mode="suggest_from_repo",
        ),
    )

    assert result.project_summary == "summary"


@pytest.mark.asyncio
async def test_collect_github_repo_uses_readme_endpoint(monkeypatch):
    responses = {
        "https://api.github.com/repos/acme/repo": httpx.Response(
            200,
            json={
                "full_name": "acme/repo",
                "description": "Demo repo",
                "homepage": "https://example.com",
                "topics": ["saas"],
                "default_branch": "main",
            },
        ),
        "https://api.github.com/repos/acme/repo/readme": httpx.Response(
            200,
            text="# Demo\nUseful README",
        ),
        "https://api.github.com/repos/acme/repo/contents": httpx.Response(
            200,
            json=[],
        ),
    }
    monkeypatch.setattr(
        repo_understanding_module.httpx,
        "AsyncClient",
        lambda timeout=12.0: _FakeAsyncClient(responses),
    )

    content, evidence = await repo_understanding_module.repo_understanding_service._collect_github_repo(
        "https://github.com/acme/repo",
        token="gh-token",
    )

    assert "## README" in content
    assert any(item.location == "acme/repo" for item in evidence)
    assert any("Demo" in item.snippet for item in evidence)


@pytest.mark.asyncio
async def test_collect_github_repo_returns_actionable_private_repo_error(monkeypatch):
    responses = {
        "https://api.github.com/repos/acme/private-repo": httpx.Response(
            404,
            json={"message": "Not Found"},
        ),
    }
    monkeypatch.setattr(
        repo_understanding_module.httpx,
        "AsyncClient",
        lambda timeout=12.0: _FakeAsyncClient(responses),
    )

    with pytest.raises(RuntimeError) as exc:
        await repo_understanding_module.repo_understanding_service._collect_github_repo(
            "https://github.com/acme/private-repo",
            token="gh-token",
        )

    assert "not found or is not accessible with the connected GitHub account" in str(exc.value)


@pytest.mark.asyncio
async def test_repo_understanding_uses_firecrawl_for_non_github_manual_url(monkeypatch):
    monkeypatch.setattr(
        repo_understanding_module.repo_understanding_service,
        "_collect_public_site",
        AsyncMock(return_value=("site content", [])),
    )
    monkeypatch.setattr(
        repo_understanding_module.repo_understanding_service,
        "_synthesize_understanding",
        AsyncMock(return_value=RepoUnderstandingResult(project_summary="summary")),
    )

    result = await repo_understanding_module.repo_understanding_service.understand(
        "user-1",
        PersonaDraftRequest(
            repo_source="manual_url",
            manual_url="https://example.com",
            mode="suggest_from_repo",
        ),
    )

    assert result.project_summary == "summary"

from __future__ import annotations

import sys
import types
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from api.routers import psychology as psychology_router
from api.services.project_generation_context import ProjectGenerationContextStoreError


@pytest.mark.asyncio
async def test_dispatch_pipeline_fails_observably_when_generation_context_unavailable(monkeypatch):
    build_context = AsyncMock(
        side_effect=ProjectGenerationContextStoreError("generation_context_unavailable")
    )
    get_llm = AsyncMock(return_value=object())
    updates: list[dict] = []

    monkeypatch.setattr(
        psychology_router.ai_runtime_service,
        "preflight_providers",
        AsyncMock(return_value=SimpleNamespace(has_optional_provider=lambda _name: False)),
    )
    monkeypatch.setattr(psychology_router.user_llm_service, "get_crewai_llm", get_llm)
    monkeypatch.setattr(
        psychology_router.project_intelligence_service,
        "build_generation_context",
        build_context,
    )
    monkeypatch.setattr(
        psychology_router.job_store,
        "update",
        AsyncMock(side_effect=lambda *args, **kwargs: updates.append(kwargs)),
    )

    class FakeStatus:
        def transition(self, *args, **kwargs):
            return None

    monkeypatch.setattr(psychology_router, "get_status_service", lambda: FakeStatus(), raising=False)

    await psychology_router._run_pipeline_task(
        task_id="task-1",
        content_record_id="content-1",
        user_id="user-1",
        request=SimpleNamespace(
            target_format="article",
            project_id="project-1",
            angle_data={"title": "Founders"},
            creator_voice={},
            seo_keyword=None,
        ),
    )

    build_context.assert_awaited_once()
    get_llm.assert_not_awaited()
    assert updates[-1]["status"] == "failed"
    assert updates[-1]["error"] == "generation_context_unavailable"


@pytest.mark.asyncio
async def test_dispatch_pipeline_writes_generation_signal_after_success(monkeypatch):
    context = SimpleNamespace(
        context_log_id="ctx-log-1",
        prompt_text="--- PROJECT INTELLIGENCE CONTEXT ---\nAudience: founders",
    )
    record_signal = AsyncMock(return_value={"id": "signal-1"})
    saved: dict[str, str] = {}

    monkeypatch.setattr(
        psychology_router.ai_runtime_service,
        "preflight_providers",
        AsyncMock(return_value=SimpleNamespace(has_optional_provider=lambda _name: False)),
    )
    class FakeProviderEnv:
        def __enter__(self):
            return None

        def __exit__(self, *args):
            return None

    monkeypatch.setattr(
        psychology_router.ai_runtime_service,
        "bind_provider_env",
        lambda resolution: FakeProviderEnv(),
    )
    monkeypatch.setattr(psychology_router.user_llm_service, "get_crewai_llm", AsyncMock(return_value=object()))
    monkeypatch.setattr(
        psychology_router.project_intelligence_service,
        "build_generation_context",
        AsyncMock(return_value=context),
    )
    monkeypatch.setattr(
        psychology_router.project_intelligence_service,
        "record_generation_signal",
        record_signal,
    )
    monkeypatch.setattr(psychology_router.job_store, "update", AsyncMock())

    class FakeStatus:
        def save_content_body(self, content_record_id, body, edited_by):
            saved["body"] = body

        def transition(self, *args, **kwargs):
            return None

        def update_idea(self, *args, **kwargs):
            return None

    monkeypatch.setattr(psychology_router, "get_status_service", lambda: FakeStatus(), raising=False)

    class FakeShortCrew:
        def __init__(self, llm_model):
            pass

        def generate_short(self, **kwargs):
            assert "project_generation_context" in kwargs["creator_voice"]
            return {"script": "Generated script"}

    fake_module = types.ModuleType("agents.short.short_crew")
    fake_module.ShortContentCrew = FakeShortCrew
    monkeypatch.setitem(sys.modules, "agents.short.short_crew", fake_module)

    await psychology_router._run_pipeline_task(
        task_id="task-1",
        content_record_id="content-1",
        user_id="user-1",
        request=SimpleNamespace(
            target_format="short",
            project_id="project-1",
            angle_data={"title": "Founders", "topics": ["growth"], "source_idea_ids": []},
            creator_voice={},
            seo_keyword=None,
        ),
    )

    assert saved["body"] == "Generated script"
    record_signal.assert_awaited_once()
    assert record_signal.await_args.kwargs["context_log_id"] == "ctx-log-1"

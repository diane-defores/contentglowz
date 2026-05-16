import sys
import types
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from api.services import pydantic_ai_runtime


def _install_fake_pydantic_ai(monkeypatch):
    created: dict[str, object] = {}

    class FakeProvider:
        def __init__(self, **kwargs):
            self.kwargs = kwargs

    class FakeModel:
        def __init__(self, model_name, *, provider):
            self.model_name = model_name
            self.provider = provider

    class FakeAgent:
        def __init__(self, **kwargs):
            self.kwargs = kwargs
            created["agent"] = self

        async def run(self, prompt, **kwargs):
            return SimpleNamespace(
                output={
                    "prompt": prompt,
                    "deps": kwargs.get("deps"),
                    "api_key": self.kwargs["model"].provider.kwargs["api_key"],
                }
            )

    root = types.ModuleType("pydantic_ai")
    root.Agent = FakeAgent

    models_pkg = types.ModuleType("pydantic_ai.models")
    openrouter_models = types.ModuleType("pydantic_ai.models.openrouter")
    openrouter_models.OpenRouterModel = FakeModel

    providers_pkg = types.ModuleType("pydantic_ai.providers")
    openrouter_provider = types.ModuleType("pydantic_ai.providers.openrouter")
    openrouter_provider.OpenRouterProvider = FakeProvider

    monkeypatch.setitem(sys.modules, "pydantic_ai", root)
    monkeypatch.setitem(sys.modules, "pydantic_ai.models", models_pkg)
    monkeypatch.setitem(sys.modules, "pydantic_ai.models.openrouter", openrouter_models)
    monkeypatch.setitem(sys.modules, "pydantic_ai.providers", providers_pkg)
    monkeypatch.setitem(sys.modules, "pydantic_ai.providers.openrouter", openrouter_provider)
    return created


def test_build_openrouter_model_uses_explicit_request_key(monkeypatch):
    _install_fake_pydantic_ai(monkeypatch)
    monkeypatch.setenv("OPENROUTER_API_KEY", "ambient-key")

    model = pydantic_ai_runtime.build_openrouter_model(
        api_key=" request-key ",
        model_name="openai/test",
    )

    assert model.model_name == "openai/test"
    assert model.provider.kwargs["api_key"] == "request-key"
    assert model.provider.kwargs["api_key"] != "ambient-key"


def test_build_openrouter_model_rejects_missing_request_key(monkeypatch):
    _install_fake_pydantic_ai(monkeypatch)
    monkeypatch.setenv("OPENROUTER_API_KEY", "ambient-key")

    with pytest.raises(pydantic_ai_runtime.PydanticAIRuntimeError):
        pydantic_ai_runtime.build_openrouter_model(api_key="")


def test_result_output_requires_current_output_attribute():
    assert pydantic_ai_runtime.result_output(SimpleNamespace(output={"ok": True})) == {
        "ok": True
    }
    with pytest.raises(pydantic_ai_runtime.PydanticAIRuntimeError):
        pydantic_ai_runtime.result_output(SimpleNamespace(data={"legacy": True}))


@pytest.mark.asyncio
async def test_run_openrouter_structured_uses_resolved_user_key(monkeypatch):
    _install_fake_pydantic_ai(monkeypatch)
    monkeypatch.setattr(
        pydantic_ai_runtime,
        "resolve_openrouter_key",
        AsyncMock(return_value="resolved-user-key"),
    )

    output = await pydantic_ai_runtime.run_openrouter_structured(
        "user-1",
        system_prompt="system",
        user_prompt="prompt",
        output_type=dict,
        route="personas.draft",
        deps={"request_id": "r1"},
    )

    assert output == {
        "prompt": "prompt",
        "deps": {"request_id": "r1"},
        "api_key": "resolved-user-key",
    }
    pydantic_ai_runtime.resolve_openrouter_key.assert_awaited_once_with(
        "user-1",
        route="personas.draft",
    )

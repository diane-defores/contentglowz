from __future__ import annotations

from types import SimpleNamespace

import pytest

from api.services.project_generation_context import (
    ProjectGenerationContextBuilder,
    ProjectGenerationContextStoreError,
)


class FakeContextStore:
    def __init__(self) -> None:
        self.facts: list[dict] = []
        self.chunks: list[dict] = []
        self.signals: list[dict] = []
        self.logs: list[dict] = []

    async def list_generation_context_facts(self, **kwargs):
        return list(self.facts)

    async def list_generation_context_chunks(self, **kwargs):
        return list(self.chunks)

    async def list_generation_signals(self, **kwargs):
        return list(self.signals)

    async def write_generation_context_log(self, **kwargs):
        self.logs.append(kwargs)
        return {
            "id": "ctx-log-1",
            "userId": kwargs["user_id"],
            "projectId": kwargs["project_id"],
            "generationType": kwargs["generation_type"],
            "items": kwargs["items"],
            "provenance": kwargs["provenance"],
            "exclusions": kwargs["exclusions"],
            "promptHash": kwargs["prompt_hash"],
        }


@pytest.mark.asyncio
async def test_builder_selects_required_facts_before_retrieved_excerpts_and_is_deterministic():
    store = FakeContextStore()
    store.facts = [
        {
            "id": "fact-b",
            "sourceId": "source-1",
            "documentId": "doc-1",
            "chunkId": "chunk-1",
            "category": "audience",
            "subject": "Audience",
            "statement": "Primary audience is solo founders.",
            "confidence": 0.9,
            "priority": 1,
            "updatedAt": "2026-07-10T00:00:00+00:00",
        },
        {
            "id": "fact-a",
            "sourceId": "source-1",
            "documentId": "doc-1",
            "chunkId": "chunk-1",
            "category": "positioning",
            "subject": "Positioning",
            "statement": "Position around practical content systems.",
            "confidence": 0.8,
            "priority": 1,
            "updatedAt": "2026-07-09T00:00:00+00:00",
        },
    ]
    store.chunks = [
        {
            "id": "chunk-2",
            "sourceId": "source-1",
            "documentId": "doc-1",
            "orderIndex": 2,
            "text": "Relevant newsletter inventory evidence.",
            "snippet": "Relevant newsletter inventory evidence.",
            "createdAt": "2026-07-09T00:00:00+00:00",
        }
    ]

    builder = ProjectGenerationContextBuilder(store=store)
    request = {
        "user_id": "user-1",
        "project_id": "project-1",
        "generation_type": "newsletter",
        "route_id": "newsletter.generate",
        "query": "newsletter inventory",
        "max_tokens": 6000,
    }

    first = await builder.build(**request)
    second = await builder.build(**request)

    assert [item.id for item in first.items] == [item.id for item in second.items]
    assert [item.item_type for item in first.items][:2] == ["fact", "fact"]
    assert first.items[0].id == "fact:fact-b"
    assert first.items[-1].item_type == "source_excerpt"
    assert first.prompt_text == second.prompt_text
    assert first.context_log_id == "ctx-log-1"
    assert all(ref.user_id == "user-1" and ref.project_id == "project-1" for ref in first.provenance)


@pytest.mark.asyncio
async def test_builder_enforces_budget_and_records_truncation_without_raw_log_body():
    store = FakeContextStore()
    store.facts = [
        {
            "id": "fact-1",
            "sourceId": "source-1",
            "documentId": "doc-1",
            "chunkId": "chunk-1",
            "category": "audience",
            "subject": "Audience",
            "statement": "A" * 120,
            "confidence": 0.9,
            "priority": 1,
        }
    ]
    store.chunks = [
        {
            "id": "chunk-secret",
            "sourceId": "source-1",
            "documentId": "doc-1",
            "orderIndex": 0,
            "text": "RAW_PRIVATE_BODY_SHOULD_NOT_BE_LOGGED " + ("B" * 500),
        }
    ]

    builder = ProjectGenerationContextBuilder(store=store)
    result = await builder.build(
        user_id="user-1",
        project_id="project-1",
        generation_type="article",
        route_id="psychology.dispatch_pipeline.article",
        query="private",
        max_tokens=80,
    )

    assert result.token_estimate <= 80
    assert result.truncated_counts["source_excerpt"] >= 1
    assert result.items[0].item_type == "fact"
    logged = str(store.logs[-1])
    assert "RAW_PRIVATE_BODY_SHOULD_NOT_BE_LOGGED" not in logged


@pytest.mark.asyncio
async def test_builder_returns_explicit_empty_context_with_log():
    store = FakeContextStore()
    builder = ProjectGenerationContextBuilder(store=store)

    result = await builder.build(
        user_id="user-1",
        project_id="project-empty",
        generation_type="newsletter",
        route_id="newsletter.generate",
        query="anything",
    )

    assert result.degraded is False
    assert result.items == []
    assert result.empty_reason == "empty_project_context"
    assert result.context_log_id == "ctx-log-1"
    assert "empty_project_context" in result.prompt_text


@pytest.mark.asyncio
async def test_builder_raises_context_error_when_store_unavailable():
    class BrokenStore(FakeContextStore):
        async def list_generation_context_facts(self, **kwargs):
            raise RuntimeError("database contains raw tenant payload")

    builder = ProjectGenerationContextBuilder(store=BrokenStore())

    with pytest.raises(ProjectGenerationContextStoreError) as exc:
        await builder.build(
            user_id="user-1",
            project_id="project-1",
            generation_type="newsletter",
            route_id="newsletter.generate",
            query="anything",
        )

    assert exc.value.code == "generation_context_unavailable"
    assert "raw tenant payload" not in str(exc.value)

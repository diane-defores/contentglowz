from __future__ import annotations

import pytest

from api.services.project_intelligence_store import ProjectIntelligenceStore
from utils.libsql_async import create_client


async def _seed_fact(store: ProjectIntelligenceStore, *, user_id: str, project_id: str, source_label: str = "Source"):
    source = await store.create_source(
        user_id=user_id,
        project_id=project_id,
        source_type="upload",
        source_label=source_label,
        status="ingested",
        origin_ref=f"{source_label}.md",
        content_hash=f"hash-{user_id}-{project_id}-{source_label}",
        summary_text="summary",
        metadata={},
    )
    document = await store.create_document(
        source_id=source["id"],
        user_id=user_id,
        project_id=project_id,
        title=f"{source_label}.md",
        mime_type="text/markdown",
        file_name=f"{source_label}.md",
        content_hash=f"raw-{source['id']}",
        normalized_hash=f"norm-{source['id']}",
        text_body="Primary audience is founders. RAW_PRIVATE_BODY_SHOULD_NOT_BE_LOGGED",
        snippet="Primary audience is founders.",
        char_count=70,
    )
    chunks = await store.create_chunks(
        [
            {
                "documentId": document["id"],
                "sourceId": source["id"],
                "userId": user_id,
                "projectId": project_id,
                "orderIndex": 0,
                "startOffset": 0,
                "endOffset": 29,
                "text": "Primary audience is founders.",
                "contentHash": f"chunk-{source['id']}",
            }
        ]
    )
    facts = await store.create_facts(
        [
            {
                "sourceId": source["id"],
                "documentId": document["id"],
                "chunkId": chunks[0]["id"],
                "userId": user_id,
                "projectId": project_id,
                "category": "audience",
                "subject": "Audience",
                "statement": "Primary audience is founders.",
                "confidence": 0.9,
                "priority": 1,
                "evidenceSnippet": "Primary audience is founders.",
                "metadata": {},
            }
        ]
    )
    return source, document, chunks[0], facts[0]


@pytest.mark.asyncio
async def test_generation_context_schema_logs_signals_and_tenant_isolation():
    store = ProjectIntelligenceStore(db_client=create_client(url=":memory:"))
    await store.ensure_tables()
    source, document, chunk, fact = await _seed_fact(store, user_id="user-1", project_id="project-1")
    await _seed_fact(store, user_id="user-2", project_id="project-1")
    await _seed_fact(store, user_id="user-1", project_id="project-2")

    facts = await store.list_generation_context_facts(user_id="user-1", project_id="project-1", limit=50)
    chunks = await store.list_generation_context_chunks(
        user_id="user-1",
        project_id="project-1",
        query="founders",
        limit=50,
    )

    assert [item["id"] for item in facts] == [fact["id"]]
    assert [item["id"] for item in chunks] == [chunk["id"]]

    log = await store.write_generation_context_log(
        user_id="user-1",
        project_id="project-1",
        generation_type="newsletter",
        route_id="newsletter.generate",
        content_record_id="content-1",
        request={"query": "founders"},
        budget={"maxTokens": 6000},
        items=[{"id": "fact:" + fact["id"], "text": "Primary audience is founders."}],
        provenance=[{"sourceId": source["id"], "documentId": document["id"], "factId": fact["id"]}],
        exclusions=[],
        prompt_hash="hash",
        prompt_char_count=120,
        token_estimate=30,
        degraded=False,
        empty_reason=None,
    )
    signal = await store.write_generation_signal(
        user_id="user-1",
        project_id="project-1",
        generation_type="newsletter",
        content_type="newsletter",
        title="Subject",
        content_record_id="content-1",
        topics=["founders"],
        summary="Bounded summary",
        body_hash="body-hash",
        body_char_count=500,
        context_log_id=log["id"],
        source_idea_ids=[],
        metadata={"sourceId": source["id"]},
    )

    assert log["userId"] == "user-1"
    assert signal["contextLogId"] == log["id"]
    assert await store.list_generation_signals(user_id="user-2", project_id="project-1") == []


@pytest.mark.asyncio
async def test_generation_context_excludes_removed_source_and_invalidates_signals():
    store = ProjectIntelligenceStore(db_client=create_client(url=":memory:"))
    await store.ensure_tables()
    source, document, _chunk, fact = await _seed_fact(store, user_id="user-1", project_id="project-1")
    log = await store.write_generation_context_log(
        user_id="user-1",
        project_id="project-1",
        generation_type="newsletter",
        route_id="newsletter.generate",
        content_record_id=None,
        request={},
        budget={},
        items=[{"id": "fact:" + fact["id"]}],
        provenance=[{"sourceId": source["id"], "documentId": document["id"], "factId": fact["id"]}],
        exclusions=[],
        prompt_hash="hash",
        prompt_char_count=10,
        token_estimate=3,
        degraded=False,
        empty_reason=None,
    )
    await store.write_generation_signal(
        user_id="user-1",
        project_id="project-1",
        generation_type="newsletter",
        content_type="newsletter",
        title="Subject",
        content_record_id=None,
        topics=[],
        summary="summary",
        body_hash="body-hash",
        body_char_count=400,
        context_log_id=log["id"],
        source_idea_ids=[],
        metadata={},
    )

    assert await store.mark_source_removed(user_id="user-1", project_id="project-1", source_id=source["id"])
    assert await store.list_generation_context_facts(user_id="user-1", project_id="project-1") == []
    assert await store.list_generation_context_chunks(user_id="user-1", project_id="project-1", query="founders") == []
    assert await store.list_generation_signals(user_id="user-1", project_id="project-1") == []


@pytest.mark.asyncio
async def test_generation_context_excludes_duplicate_links_to_removed_canonical_document():
    store = ProjectIntelligenceStore(db_client=create_client(url=":memory:"))
    await store.ensure_tables()
    removed_source, removed_document, _removed_chunk, _removed_fact = await _seed_fact(
        store,
        user_id="user-1",
        project_id="project-1",
        source_label="Canonical",
    )
    active_source, active_document, _active_chunk, active_fact = await _seed_fact(
        store,
        user_id="user-1",
        project_id="project-1",
        source_label="Duplicate",
    )
    await store.create_duplicate(
        user_id="user-1",
        project_id="project-1",
        document_id=active_document["id"],
        canonical_document_id=removed_document["id"],
        kind="exact",
        similarity=1.0,
        reason="same source",
    )

    await store.mark_source_removed(user_id="user-1", project_id="project-1", source_id=removed_source["id"])

    facts = await store.list_generation_context_facts(user_id="user-1", project_id="project-1")
    assert active_fact["id"] not in [item["id"] for item in facts]
    assert active_source["id"] != removed_source["id"]

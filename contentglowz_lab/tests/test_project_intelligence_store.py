import pytest

from api.services.project_intelligence_store import ProjectIntelligenceStore
from utils.libsql_async import create_client


@pytest.mark.asyncio
async def test_project_intelligence_store_roundtrip_and_source_removal():
    store = ProjectIntelligenceStore(db_client=create_client(url=":memory:"))
    await store.ensure_tables()

    job = await store.create_job(
        user_id="user-1",
        project_id="project-1",
        job_type="project_intelligence.ingest",
    )
    assert job["status"] == "running"
    active = await store.get_active_job(user_id="user-1", project_id="project-1")
    assert active is not None

    source = await store.create_source(
        user_id="user-1",
        project_id="project-1",
        source_type="upload",
        source_label="Uploaded File",
        status="ingested",
        origin_ref="notes.md",
        content_hash="hash-1",
        summary_text="summary",
        metadata={"k": "v"},
    )
    document = await store.create_document(
        source_id=source["id"],
        user_id="user-1",
        project_id="project-1",
        title="notes.md",
        mime_type="text/markdown",
        file_name="notes.md",
        content_hash="raw-h",
        normalized_hash="norm-h",
        text_body="Audience and SEO notes",
        snippet="Audience and SEO notes",
        char_count=22,
    )
    chunks = await store.create_chunks(
        [
            {
                "documentId": document["id"],
                "sourceId": source["id"],
                "userId": "user-1",
                "projectId": "project-1",
                "orderIndex": 0,
                "startOffset": 0,
                "endOffset": 22,
                "text": "Audience and SEO notes",
                "contentHash": "chunk-h",
            }
        ]
    )
    await store.create_facts(
        [
            {
                "sourceId": source["id"],
                "documentId": document["id"],
                "chunkId": chunks[0]["id"],
                "userId": "user-1",
                "projectId": "project-1",
                "category": "seo",
                "subject": "keyword",
                "statement": "SEO notes",
                "confidence": 0.7,
                "priority": 1,
                "evidenceSnippet": "SEO notes",
                "metadata": {"rule": "test"},
            }
        ]
    )
    await store.upsert_recommendations(
        [
            {
                "userId": "user-1",
                "projectId": "project-1",
                "recommendationKey": "rec-1",
                "recommendationType": "seo_backlog",
                "title": "Create SEO ideas",
                "summary": "Add ideas from SEO.",
                "rationale": "Signals exist.",
                "priority": 1,
                "confidence": 0.8,
                "status": "open",
                "evidenceIds": [source["id"], document["id"]],
                "evidence": [{"sourceId": source["id"]}],
                "metadata": {"deterministic": True},
            }
        ]
    )

    sources = await store.list_sources(user_id="user-1", project_id="project-1")
    documents = await store.list_documents(user_id="user-1", project_id="project-1")
    facts = await store.list_facts(user_id="user-1", project_id="project-1")
    recommendations = await store.list_recommendations(user_id="user-1", project_id="project-1")
    assert len(sources) == 1
    assert len(documents) == 1
    assert len(facts) == 1
    assert len(recommendations) == 1

    removed = await store.mark_source_removed(
        user_id="user-1",
        project_id="project-1",
        source_id=source["id"],
    )
    assert removed is True
    assert await store.list_sources(user_id="user-1", project_id="project-1") == []
    assert await store.list_facts(user_id="user-1", project_id="project-1") == []

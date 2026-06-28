from api.services.project_intelligence_processor import (
    build_chunks,
    build_provider_readiness,
    build_recommendations,
    extract_text,
    similarity_score,
    validate_upload,
)


def test_validate_upload_rejects_oversized_and_unsupported():
    assert validate_upload("notes.pdf", "application/pdf", 1200) == "unsupported_file_type"
    assert validate_upload("notes.md", "text/markdown", 0) == "empty_file"
    assert validate_upload("notes.md", "text/markdown", 11 * 1024 * 1024) == "file_too_large"


def test_extract_text_strips_html_scripts():
    payload = b"<html><body><h1>Roadmap</h1><script>alert('x')</script><p>Audience focus</p></body></html>"
    parsed = extract_text(payload, "text/html", "roadmap.html")
    assert "alert('x')" not in parsed.text
    assert "Roadmap" in parsed.text
    assert "Audience focus" in parsed.text


def test_build_chunks_produces_stable_offsets():
    text = "A" * 2400
    chunks = build_chunks(text, chunk_size=1000, overlap=100)
    assert len(chunks) >= 3
    assert chunks[0].start_offset == 0
    assert chunks[1].start_offset == 900
    assert chunks[0].end_offset == 1000


def test_similarity_score_detects_near_duplicates():
    a = "Audience positioning SEO strategy and conversion plan"
    b = "SEO strategy for audience positioning with conversion plan"
    c = "Completely different gardening checklist"
    assert similarity_score(a, b) > 0.6
    assert similarity_score(a, c) < 0.2


def test_build_recommendations_and_provider_readiness():
    sources = [
        {"id": "s1", "sourceType": "upload"},
        {"id": "s2", "sourceType": "search_console_snapshot"},
    ]
    facts = [{"id": "f1", "category": "seo", "confidence": 0.75}]
    duplicates = [{"documentId": "d2"}]
    recommendations = build_recommendations(
        user_id="user-1",
        project_id="project-1",
        sources=sources,
        facts=facts,
        duplicates=duplicates,
    )
    keys = {item["recommendationKey"] for item in recommendations}
    assert "missing_audience_signal" in keys
    assert "duplicate_evidence_detected" in keys

    readiness = build_provider_readiness(project_id="project-1", sources=sources, facts=facts)
    assert readiness["readiness"] in {"needs_evidence", "curation_in_progress", "rag_ready"}

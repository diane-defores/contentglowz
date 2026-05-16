from __future__ import annotations

import csv
import hashlib
import io
import json
import re
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

from bs4 import BeautifulSoup


MAX_FILES_PER_JOB = 10
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
MAX_CONNECTOR_ITEMS = 200
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 120

SUPPORTED_MIME_TYPES = {
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/json",
    "text/html",
}
SUPPORTED_EXTENSIONS = {
    ".txt",
    ".md",
    ".markdown",
    ".csv",
    ".json",
    ".html",
    ".htm",
}

WORD_RE = re.compile(r"[a-zA-Z0-9]{3,}")


@dataclass
class ProcessedText:
    text: str
    normalized_text: str
    raw_hash: str
    normalized_hash: str
    char_count: int
    snippet: str


@dataclass
class ChunkPayload:
    order_index: int
    start_offset: int
    end_offset: int
    text: str
    content_hash: str


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def normalize_text(text: str) -> str:
    compact = re.sub(r"[ \t]+", " ", text.replace("\r", "\n"))
    compact = re.sub(r"\n{3,}", "\n\n", compact)
    return compact.strip()


def normalize_for_hash(text: str) -> str:
    return " ".join(text.lower().split())


def is_supported_upload(filename: str | None, content_type: str | None) -> bool:
    mime = (content_type or "").split(";")[0].strip().lower()
    if mime in SUPPORTED_MIME_TYPES:
        return True
    if not filename:
        return False
    lowered = filename.lower().strip()
    return any(lowered.endswith(ext) for ext in SUPPORTED_EXTENSIONS)


def validate_upload(filename: str | None, content_type: str | None, size: int) -> str | None:
    if size <= 0:
        return "empty_file"
    if size > MAX_FILE_SIZE_BYTES:
        return "file_too_large"
    if not is_supported_upload(filename, content_type):
        return "unsupported_file_type"
    return None


def _parse_json_to_text(raw: str) -> str:
    payload = json.loads(raw)
    lines: list[str] = []

    def _walk(prefix: str, value: Any) -> None:
        if isinstance(value, dict):
            for key in sorted(value.keys()):
                next_prefix = f"{prefix}.{key}" if prefix else str(key)
                _walk(next_prefix, value[key])
            return
        if isinstance(value, list):
            for index, item in enumerate(value):
                next_prefix = f"{prefix}[{index}]"
                _walk(next_prefix, item)
            return
        if value is None:
            return
        scalar = str(value).strip()
        if not scalar:
            return
        lines.append(f"{prefix}: {scalar}")

    _walk("", payload)
    return "\n".join(lines)


def _parse_csv_to_text(raw: str) -> str:
    stream = io.StringIO(raw)
    reader = csv.reader(stream)
    rows = list(reader)
    if not rows:
        return ""
    header = rows[0]
    output: list[str] = []
    if header:
        output.append("Columns: " + ", ".join(str(col).strip() for col in header))
    for row in rows[1:121]:
        if not any(str(cell).strip() for cell in row):
            continue
        pairs = []
        for index, cell in enumerate(row):
            label = header[index] if index < len(header) else f"col_{index + 1}"
            pairs.append(f"{label}={str(cell).strip()}")
        output.append("; ".join(pairs))
    return "\n".join(output)


def _parse_html_to_text(raw: str) -> str:
    soup = BeautifulSoup(raw, "html.parser")
    for node in soup(["script", "style", "noscript", "iframe"]):
        node.extract()
    return soup.get_text(separator="\n")


def extract_text(raw_bytes: bytes, content_type: str | None, filename: str | None = None) -> ProcessedText:
    decoded = raw_bytes.decode("utf-8", errors="ignore")
    mime = (content_type or "").split(";")[0].strip().lower()
    lowered = (filename or "").lower()

    try:
        if mime == "application/json" or lowered.endswith(".json"):
            parsed = _parse_json_to_text(decoded)
        elif mime == "text/csv" or lowered.endswith(".csv"):
            parsed = _parse_csv_to_text(decoded)
        elif mime == "text/html" or lowered.endswith(".html") or lowered.endswith(".htm"):
            parsed = _parse_html_to_text(decoded)
        else:
            parsed = decoded
    except Exception:
        parsed = decoded

    cleaned = normalize_text(parsed)
    normalized_hash_input = normalize_for_hash(cleaned)
    return ProcessedText(
        text=cleaned,
        normalized_text=normalized_hash_input,
        raw_hash=sha256_text(decoded),
        normalized_hash=sha256_text(normalized_hash_input),
        char_count=len(cleaned),
        snippet=cleaned[:280],
    )


def build_chunks(text: str, *, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[ChunkPayload]:
    content = text.strip()
    if not content:
        return []
    if len(content) <= chunk_size:
        return [
            ChunkPayload(
                order_index=0,
                start_offset=0,
                end_offset=len(content),
                text=content,
                content_hash=sha256_text(content),
            )
        ]
    chunks: list[ChunkPayload] = []
    start = 0
    order = 0
    while start < len(content):
        end = min(len(content), start + chunk_size)
        piece = content[start:end].strip()
        if piece:
            chunks.append(
                ChunkPayload(
                    order_index=order,
                    start_offset=start,
                    end_offset=end,
                    text=piece,
                    content_hash=sha256_text(piece),
                )
            )
            order += 1
        if end >= len(content):
            break
        start = max(0, end - overlap)
    return chunks


def token_signature(text: str, *, limit: int = 300) -> set[str]:
    return set(WORD_RE.findall(text.lower())) if text else set()


def similarity_score(text_a: str, text_b: str) -> float:
    a = token_signature(text_a)
    b = token_signature(text_b)
    if not a or not b:
        return 0.0
    overlap = len(a & b)
    union = len(a | b)
    if union == 0:
        return 0.0
    return overlap / union


def _extract_sentence_with_keyword(text: str, keyword: str) -> str | None:
    sentences = re.split(r"(?<=[.!?])\s+", text)
    lowered = keyword.lower()
    for sentence in sentences:
        if lowered in sentence.lower():
            return sentence.strip()[:260]
    return None


FACT_KEYWORDS: dict[str, tuple[str, ...]] = {
    "audience": ("audience", "customer", "persona", "segment"),
    "offer": ("offer", "pricing", "plan", "product"),
    "positioning": ("positioning", "differentiator", "unique", "value proposition"),
    "channel": ("channel", "newsletter", "youtube", "linkedin", "tiktok"),
    "seo": ("keyword", "impressions", "ctr", "search console", "ranking"),
    "competitor": ("competitor", "benchmark", "rival"),
    "constraint": ("constraint", "limit", "blocked", "risk"),
    "content_asset": ("asset", "video", "template", "article"),
    "risk": ("risk", "issue", "warning", "problem"),
    "open_question": ("question", "unknown", "todo", "investigate"),
}


def extract_facts_from_chunks(
    *,
    user_id: str,
    project_id: str,
    source_id: str,
    document_id: str,
    chunks: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    facts: list[dict[str, Any]] = []
    for chunk in chunks:
        text = str(chunk.get("text") or "")
        if not text:
            continue
        for category, keywords in FACT_KEYWORDS.items():
            hit = next((kw for kw in keywords if kw in text.lower()), None)
            if not hit:
                continue
            evidence = _extract_sentence_with_keyword(text, hit) or text[:240]
            facts.append(
                {
                    "sourceId": source_id,
                    "documentId": document_id,
                    "chunkId": chunk["id"],
                    "userId": user_id,
                    "projectId": project_id,
                    "category": category,
                    "subject": hit,
                    "statement": evidence,
                    "confidence": 0.62 if category in {"seo", "audience", "offer"} else 0.55,
                    "priority": 1 if category in {"risk", "seo"} else 3,
                    "evidenceSnippet": evidence,
                    "metadata": {"rule": "keyword_match"},
                }
            )
            break
    return facts


def _stale_source_count(sources: list[dict[str, Any]], days: int = 30) -> int:
    threshold = datetime.now(timezone.utc) - timedelta(days=days)
    stale = 0
    for source in sources:
        created_at = source.get("createdAt")
        if isinstance(created_at, datetime) and created_at < threshold:
            stale += 1
    return stale


def build_recommendations(
    *,
    user_id: str,
    project_id: str,
    sources: list[dict[str, Any]],
    facts: list[dict[str, Any]],
    duplicates: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    recommendations: list[dict[str, Any]] = []
    source_types = {str(source.get("sourceType")) for source in sources}
    fact_categories = {str(fact.get("category")) for fact in facts}

    def _append(
        key: str,
        rec_type: str,
        title: str,
        summary: str,
        rationale: str,
        priority: int,
        confidence: float,
        evidence_ids: list[str],
    ) -> None:
        recommendations.append(
            {
                "userId": user_id,
                "projectId": project_id,
                "recommendationKey": key,
                "recommendationType": rec_type,
                "title": title,
                "summary": summary,
                "rationale": rationale,
                "priority": priority,
                "confidence": confidence,
                "status": "open",
                "evidenceIds": evidence_ids,
                "evidence": [{"sourceId": evidence_id} for evidence_id in evidence_ids],
                "metadata": {"deterministic": True},
            }
        )

    if "audience" not in fact_categories:
        evidence = [source["id"] for source in sources[:2]]
        _append(
            "missing_audience_signal",
            "missing_evidence",
            "Clarify Audience Evidence",
            "Project memory has limited audience evidence.",
            "Audience facts were not detected in current sources.",
            1,
            0.68,
            evidence,
        )

    if len(source_types) < 3:
        evidence = [source["id"] for source in sources[:3]]
        _append(
            "weak_source_diversity",
            "coverage_gap",
            "Increase Source Diversity",
            "Recommendations rely on a narrow source mix.",
            "Ingest at least one additional connector source for stronger confidence.",
            2,
            0.61,
            evidence,
        )

    if duplicates:
        evidence = [dup["documentId"] for dup in duplicates[:4]]
        _append(
            "duplicate_evidence_detected",
            "dedupe_notice",
            "Review Duplicate Inputs",
            "Duplicate documents were detected and excluded from scoring.",
            "Clean repeated inputs to keep confidence calibration stable.",
            2,
            0.73,
            evidence,
        )

    if "search_console_snapshot" in source_types and "idea_pool" not in source_types:
        evidence = [source["id"] for source in sources if source.get("sourceType") == "search_console_snapshot"][:3]
        _append(
            "seo_backlog_without_ideas",
            "seo_backlog",
            "Convert SEO Signals Into Ideas",
            "SEO evidence exists but Idea Pool coverage appears low.",
            "Create idea candidates from high-impression opportunities.",
            1,
            0.76,
            evidence,
        )

    stale_count = _stale_source_count(sources)
    if stale_count > 0:
        evidence = [source["id"] for source in sources[:3]]
        _append(
            "stale_source_data",
            "staleness",
            "Refresh Stale Sources",
            f"{stale_count} source(s) look stale and may lower recommendation quality.",
            "Run a connector sync to refresh older evidence.",
            2,
            0.66,
            evidence,
        )

    strong_facts = [fact for fact in facts if float(fact.get("confidence") or 0) >= 0.7]
    if strong_facts:
        evidence = [fact["id"] for fact in strong_facts[:5]]
        _append(
            "high_confidence_idea_candidate",
            "idea_candidate",
            "Promote High-Confidence Insight",
            "At least one high-confidence fact is ready for Idea Pool triage.",
            "Convert this insight into a reviewable idea to accelerate execution.",
            1,
            0.79,
            evidence,
        )

    return recommendations


def build_provider_readiness(
    *,
    project_id: str,
    sources: list[dict[str, Any]],
    facts: list[dict[str, Any]],
) -> dict[str, Any]:
    source_count = len(sources)
    fact_count = len(facts)
    if source_count < 2 or fact_count < 3:
        return {
            "projectId": project_id,
            "readiness": "needs_evidence",
            "score": 32,
            "rationale": "Project memory is still sparse; prioritize ingestion and curation first.",
            "recommendedNextStep": "Ingest more project sources and confirm evidence quality.",
            "warnings": [
                "Do not export for fine-tuning yet.",
                "Gemini API fine-tuning is not currently available as a default path in this V1.",
            ],
        }

    if source_count >= 3 and fact_count >= 8:
        return {
            "projectId": project_id,
            "readiness": "rag_ready",
            "score": 74,
            "rationale": "Evidence diversity and fact density are sufficient for retrieval-first workflows.",
            "recommendedNextStep": "Use retrieval/file-search style integration and continue evidence refresh.",
            "warnings": [
                "Fine-tuning should remain a later, evaluated provider-specific step.",
                "Gemini readiness should target retrieval/embeddings or a future Vertex adapter, not immediate fine-tuning claims.",
            ],
        }

    return {
        "projectId": project_id,
        "readiness": "curation_in_progress",
        "score": 56,
        "rationale": "Memory quality is improving but still benefits from additional corroborated evidence.",
        "recommendedNextStep": "Add at least one more connector and resolve duplicate/stale sources.",
        "warnings": [
            "Avoid claiming automatic provider training/deployment in this phase.",
        ],
    }

"""Normalizer for provider payloads used by asset understanding."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

FORBIDDEN_KEYS = {
    "raw_frames",
    "frames_base64",
    "base64_frames",
    "raw_transcript",
    "full_transcript",
    "prompt",
    "prompt_text",
}


@dataclass(frozen=True)
class NormalizedUnderstandingPayload:
    summary: str | None
    tags: list["NormalizedTag"]
    segments: list["NormalizedSegment"]
    source_attribution: "NormalizedAttribution"


@dataclass(frozen=True)
class NormalizedTag:
    key: str
    label: str
    confidence: float
    source: str = "ai_suggestion"
    accepted_by_user: bool = False
    rejected_by_user: bool = False


@dataclass(frozen=True)
class NormalizedSegment:
    start_seconds: float
    end_seconds: float
    label: str
    confidence: float
    suggested_placement: str | None = None


@dataclass(frozen=True)
class NormalizedAttribution:
    source_platform: str | None = None
    source_url: str | None = None
    creator_handle: str | None = None
    creator_name: str | None = None
    credit_text: str | None = None
    rights_status: str = "unknown"
    credit_required: bool = False


def normalize_understanding_payload(payload: dict[str, Any]) -> NormalizedUnderstandingPayload:
    forbidden = FORBIDDEN_KEYS.intersection(payload.keys())
    if forbidden:
        raise ValueError(f"Forbidden provider fields present: {', '.join(sorted(forbidden))}")

    allowed = {"summary", "tags", "segments", "source_attribution"}
    extra = set(payload.keys()) - allowed
    if extra:
        raise ValueError(f"Unexpected provider fields: {', '.join(sorted(extra))}")

    tags: list[NormalizedTag] = []
    for item in payload.get("tags", []) or []:
        if not isinstance(item, dict):
            continue
        try:
            tags.append(
                NormalizedTag(
                    key=str(item.get("key", "")).strip()[:64],
                    label=str(item.get("label", "")).strip()[:128],
                    confidence=float(item.get("confidence", 0.0)),
                )
            )
        except Exception:
            continue
    tags = [tag for tag in tags if tag.key and tag.label]

    segments: list[NormalizedSegment] = []
    for item in payload.get("segments", []) or []:
        if not isinstance(item, dict):
            continue
        try:
            segment = NormalizedSegment(
                start_seconds=float(item.get("start_seconds", 0.0)),
                end_seconds=float(item.get("end_seconds", 0.0)),
                label=str(item.get("label", "")).strip()[:128],
                confidence=float(item.get("confidence", 0.0)),
                suggested_placement=item.get("suggested_placement"),
            )
        except Exception:
            continue
        if segment.end_seconds <= segment.start_seconds:
            continue
        if not segment.label:
            continue
        segments.append(segment)

    attribution = payload.get("source_attribution") if isinstance(payload.get("source_attribution"), dict) else {}
    rights_status = attribution.get("rights_status", "unknown")
    source_attribution = NormalizedAttribution(
        source_platform=attribution.get("source_platform"),
        source_url=attribution.get("source_url"),
        creator_handle=attribution.get("creator_handle"),
        creator_name=attribution.get("creator_name"),
        credit_text=attribution.get("credit_text"),
        rights_status=rights_status,
        credit_required=bool(attribution.get("credit_required", False)) or rights_status == "unknown",
    )

    summary = payload.get("summary")
    if summary is not None:
        summary = str(summary).strip()[:600]
    if not summary:
        summary = None

    return NormalizedUnderstandingPayload(
        summary=summary,
        tags=tags,
        segments=segments,
        source_attribution=source_attribution,
    )

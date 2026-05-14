import pytest

from api.services.asset_understanding_normalizer import normalize_understanding_payload


def test_normalizer_rejects_forbidden_payload_keys():
    with pytest.raises(ValueError, match="Forbidden provider fields"):
        normalize_understanding_payload({"raw_transcript": "secret"})


def test_normalizer_rejects_unexpected_payload_keys():
    with pytest.raises(ValueError, match="Unexpected provider fields"):
        normalize_understanding_payload({"summary": "ok", "junk": True})


def test_normalizer_filters_invalid_segments_and_forces_unknown_credit_warning():
    normalized = normalize_understanding_payload(
        {
            "summary": "A deer jumping quickly.",
            "tags": [{"key": "deer", "label": "Deer", "confidence": 0.81}],
            "segments": [
                {"start_seconds": 2, "end_seconds": 1, "label": "bad", "confidence": 0.9},
                {"start_seconds": 0, "end_seconds": 4, "label": "jump", "confidence": 0.74},
            ],
            "source_attribution": {"rights_status": "unknown", "credit_required": False},
        }
    )
    assert len(normalized.tags) == 1
    assert len(normalized.segments) == 1
    assert normalized.source_attribution.credit_required is True

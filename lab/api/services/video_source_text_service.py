"""Pure text processing for private pasted video sources."""

from __future__ import annotations

from dataclasses import dataclass

from api.services.project_intelligence_processor import extract_text


MAX_PASTED_TEXT_CHARS = 100_000
TEXT_PREVIEW_CHARS = 280


class TextSourceError(ValueError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


@dataclass(frozen=True, slots=True)
class PastedTextResult:
    text: str
    normalized_text: str
    raw_hash: str
    normalized_hash: str
    char_count: int
    preview: str


def process_pasted_text(value: str) -> PastedTextResult:
    if not isinstance(value, str):
        raise TextSourceError("invalid_text", "Text must be valid UTF-8 content.")
    processed = extract_text(value.encode("utf-8"), "text/plain", "source.txt")
    if not processed.text:
        raise TextSourceError("empty_text", "Add some text before saving this source.")
    if processed.char_count > MAX_PASTED_TEXT_CHARS:
        raise TextSourceError(
            "text_too_large",
            f"Text sources are limited to {MAX_PASTED_TEXT_CHARS} characters.",
        )
    return PastedTextResult(
        text=processed.text,
        normalized_text=processed.normalized_text,
        raw_hash=processed.raw_hash,
        normalized_hash=processed.normalized_hash,
        char_count=processed.char_count,
        preview=processed.snippet[:TEXT_PREVIEW_CHARS],
    )

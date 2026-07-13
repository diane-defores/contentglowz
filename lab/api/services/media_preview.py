"""Internal derived-preview port with a safe metadata fallback."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
import hashlib
from typing import Any, Mapping, Protocol, runtime_checkable

from api.services import object_storage as _contract
from api.services.object_storage import (
    ObjectStorageError,
    ObjectStorageProvider,
    StorageLocator,
    UploadMode,
)


_MEDIA_KINDS = frozenset({"image", "video", "audio"})
_PREVIEW_CONTENT_TYPES = frozenset({"image/jpeg", "image/png", "image/webp"})


class PreviewStatus(str, Enum):
    READY = "ready"
    METADATA_FALLBACK = "metadata_fallback"


class MediaPreviewError(RuntimeError):
    """Stable preview failure used for invalid caller contracts."""

    def __init__(self, *, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code

    def __repr__(self) -> str:
        return f"MediaPreviewError(code={self.code!r})"


@dataclass(frozen=True, repr=False)
class GeneratedPreview:
    """Sanitized bytes returned by an injected internal media generator."""

    content: bytes = field(repr=False)
    content_type: str
    width: int | None = None
    height: int | None = None

    def __post_init__(self) -> None:
        if not isinstance(self.content, bytes) or not self.content:
            raise ValueError("Generated preview content is invalid")
        if self.content_type not in _PREVIEW_CONTENT_TYPES:
            raise ValueError("Generated preview content type is invalid")
        for dimension in (self.width, self.height):
            if dimension is not None and (dimension <= 0 or dimension > 8192):
                raise ValueError("Generated preview dimensions are invalid")

    def __repr__(self) -> str:
        return (
            "GeneratedPreview("
            "content=<redacted>, "
            f"content_type={self.content_type!r}, width={self.width!r}, height={self.height!r})"
        )


@dataclass(frozen=True, repr=False)
class PreviewResult:
    status: PreviewStatus
    locator: StorageLocator | None
    safe_metadata: Mapping[str, Any]
    error_code: str | None = None

    def __repr__(self) -> str:
        return (
            "PreviewResult("
            f"status={self.status.value!r}, locator={self.locator!r}, "
            f"safe_metadata={dict(self.safe_metadata)!r}, error_code={self.error_code!r})"
        )


class BoundedObjectReader:
    """Range reader that enforces a cumulative generator probe budget."""

    def __init__(
        self,
        *,
        storage: ObjectStorageProvider,
        locator: StorageLocator,
        max_total_bytes: int,
    ) -> None:
        if max_total_bytes <= 0:
            raise ValueError("Preview read budget must be positive")
        self._storage = storage
        self._locator = locator
        self.max_total_bytes = max_total_bytes
        self._consumed = 0

    def __repr__(self) -> str:
        return (
            "BoundedObjectReader("
            "storage=<redacted>, locator=<redacted>, "
            f"max_total_bytes={self.max_total_bytes}, consumed={self._consumed})"
        )

    def read(self, start: int, end: int) -> bytes:
        if start < 0 or end < start:
            raise MediaPreviewError(code="invalid_preview_range", message="Preview range is invalid")
        requested = end - start + 1
        if requested > self.max_total_bytes - self._consumed:
            raise MediaPreviewError(
                code="preview_read_budget_exceeded",
                message="Preview generation exceeded its read budget",
            )
        payload = self._storage.read_range(self._locator, start=start, end=end)
        self._consumed += len(payload)
        return payload


class PreviewGenerator(Protocol):
    def generate(
        self,
        *,
        source: StorageLocator,
        media_kind: str,
        metadata: Mapping[str, Any],
        reader: BoundedObjectReader,
    ) -> GeneratedPreview | None:
        ...


@runtime_checkable
class MediaPreviewProvider(Protocol):
    external_provider_enabled: bool

    def create_preview(
        self,
        *,
        source: StorageLocator,
        media_kind: str,
        metadata: Mapping[str, Any],
    ) -> PreviewResult:
        ...


class InternalMediaPreviewProvider:
    """Generate a distinct derived object in canonical storage when possible.

    The adapter has no external preview integration. A missing, unsupported or
    failing internal generator degrades to allowlisted technical metadata.
    """

    external_provider_enabled = False

    def __init__(
        self,
        *,
        storage: ObjectStorageProvider,
        generator: PreviewGenerator | None,
        preview_namespace: str = "previews",
        max_preview_bytes: int = 5 * 1024 * 1024,
        max_probe_bytes: int = 8 * 1024 * 1024,
    ) -> None:
        try:
            _contract._validate_namespace(preview_namespace)
        except ValueError:
            raise ValueError("Preview namespace is invalid") from None
        if max_preview_bytes <= 0 or max_probe_bytes <= 0:
            raise ValueError("Preview limits must be positive")
        self._storage = storage
        self._generator = generator
        self.preview_namespace = preview_namespace
        self.max_preview_bytes = max_preview_bytes
        self.max_probe_bytes = max_probe_bytes

    def __repr__(self) -> str:
        return (
            "InternalMediaPreviewProvider("
            "storage=<redacted>, generator=<redacted>, external_provider_enabled=False)"
        )

    def create_preview(
        self,
        *,
        source: StorageLocator,
        media_kind: str,
        metadata: Mapping[str, Any],
    ) -> PreviewResult:
        if media_kind not in _MEDIA_KINDS:
            raise MediaPreviewError(code="unsupported_media_kind", message="Media kind is unsupported")
        safe_metadata = _safe_metadata(media_kind=media_kind, metadata=metadata)
        if self._generator is None:
            return self._fallback(safe_metadata=safe_metadata)
        reader = BoundedObjectReader(
            storage=self._storage,
            locator=source,
            max_total_bytes=self.max_probe_bytes,
        )
        try:
            generated = self._generator.generate(
                source=source,
                media_kind=media_kind,
                metadata=dict(safe_metadata),
                reader=reader,
            )
        except Exception:
            return self._fallback(
                safe_metadata=safe_metadata,
                error_code="preview_generation_unavailable",
            )
        if generated is None:
            return self._fallback(
                safe_metadata=safe_metadata,
                error_code="preview_generation_unavailable",
            )
        if len(generated.content) > self.max_preview_bytes:
            return self._fallback(
                safe_metadata=safe_metadata,
                error_code="preview_payload_too_large",
            )
        checksum = hashlib.sha256(generated.content).hexdigest()
        try:
            session = self._storage.create_upload_session(
                namespace=self.preview_namespace,
                content_type=generated.content_type,
                expected_size=len(generated.content),
                checksum_sha256=checksum,
                mode=UploadMode.PROXY,
            )
            locator = self._storage.upload_proxy(session=session, source=generated.content)
        except (ObjectStorageError, ValueError):
            return self._fallback(
                safe_metadata=safe_metadata,
                error_code="preview_storage_unavailable",
            )
        ready_metadata = dict(safe_metadata)
        if generated.width is not None:
            ready_metadata["width"] = generated.width
        if generated.height is not None:
            ready_metadata["height"] = generated.height
        ready_metadata["content_type"] = generated.content_type
        return PreviewResult(
            status=PreviewStatus.READY,
            locator=locator,
            safe_metadata=ready_metadata,
        )

    @staticmethod
    def _fallback(
        *,
        safe_metadata: Mapping[str, Any],
        error_code: str | None = None,
    ) -> PreviewResult:
        return PreviewResult(
            status=PreviewStatus.METADATA_FALLBACK,
            locator=None,
            safe_metadata=dict(safe_metadata),
            error_code=error_code,
        )


def _safe_metadata(*, media_kind: str, metadata: Mapping[str, Any]) -> dict[str, Any]:
    result: dict[str, Any] = {"media_kind": media_kind}
    size_bytes = metadata.get("size_bytes")
    if isinstance(size_bytes, int) and not isinstance(size_bytes, bool) and size_bytes >= 0:
        result["size_bytes"] = size_bytes
    duration = metadata.get("duration_seconds")
    if (
        isinstance(duration, (int, float))
        and not isinstance(duration, bool)
        and 0 <= duration <= 24 * 60 * 60
    ):
        result["duration_seconds"] = duration
    for key in ("width", "height"):
        value = metadata.get(key)
        if isinstance(value, int) and not isinstance(value, bool) and 0 < value <= 8192:
            result[key] = value
    content_type = metadata.get("content_type")
    if isinstance(content_type, str) and len(content_type) <= 127:
        try:
            _contract._validate_content_type(content_type)
        except ValueError:
            pass
        else:
            result["content_type"] = content_type
    return result


__all__ = [
    "BoundedObjectReader",
    "GeneratedPreview",
    "InternalMediaPreviewProvider",
    "MediaPreviewError",
    "MediaPreviewProvider",
    "PreviewGenerator",
    "PreviewResult",
    "PreviewStatus",
]

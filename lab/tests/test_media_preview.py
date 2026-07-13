from __future__ import annotations

import hashlib

from api.services.media_preview import (
    GeneratedPreview,
    InternalMediaPreviewProvider,
    PreviewStatus,
)
from api.services.object_storage import FakeObjectStorageProvider, UploadMode


def _sha256(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def _stored_source(storage: FakeObjectStorageProvider, payload: bytes):
    session = storage.create_upload_session(
        namespace="assets",
        content_type="image/png",
        expected_size=len(payload),
        checksum_sha256=_sha256(payload),
        mode=UploadMode.PROXY,
    )
    return storage.upload_proxy(session=session, source=payload)


class StubPreviewGenerator:
    def __init__(self, payload: GeneratedPreview | None) -> None:
        self.payload = payload
        self.calls = 0

    def generate(self, *, source, media_kind, metadata, reader):
        self.calls += 1
        assert reader.read(0, 3) == b"orig"
        return self.payload


def test_internal_preview_is_a_distinct_s3_compatible_derived_object() -> None:
    storage = FakeObjectStorageProvider(max_proxy_bytes=1024, max_range_bytes=1024)
    source = _stored_source(storage, b"original-image")
    generator = StubPreviewGenerator(
        GeneratedPreview(
            content=b"preview-image",
            content_type="image/webp",
            width=320,
            height=180,
        )
    )
    provider = InternalMediaPreviewProvider(storage=storage, generator=generator)

    result = provider.create_preview(
        source=source,
        media_kind="image",
        metadata={"size_bytes": 14, "private_tag": "must-not-leak"},
    )

    assert result.status is PreviewStatus.READY
    assert result.locator is not None
    assert result.locator != source
    assert result.locator.namespace == "previews"
    assert storage.read_range(result.locator, start=0, end=12) == b"preview-image"
    assert storage.read_range(source, start=0, end=13) == b"original-image"
    assert result.safe_metadata == {
        "media_kind": "image",
        "size_bytes": 14,
        "width": 320,
        "height": 180,
        "content_type": "image/webp",
    }
    assert "private_tag" not in result.safe_metadata


def test_preview_without_generator_uses_safe_metadata_fallback() -> None:
    storage = FakeObjectStorageProvider(max_proxy_bytes=1024)
    source = _stored_source(storage, b"original-image")
    provider = InternalMediaPreviewProvider(storage=storage, generator=None)

    result = provider.create_preview(
        source=source,
        media_kind="video",
        metadata={
            "size_bytes": 14,
            "duration_seconds": 12.5,
            "width": 1920,
            "height": 1080,
            "url": "https://private.example/source?token=secret",
            "object_key": "private/key",
            "tags": {"gps": "private"},
        },
    )

    assert result.status is PreviewStatus.METADATA_FALLBACK
    assert result.locator is None
    assert result.safe_metadata == {
        "media_kind": "video",
        "size_bytes": 14,
        "duration_seconds": 12.5,
        "width": 1920,
        "height": 1080,
    }
    assert "private.example" not in repr(result)
    assert provider.external_provider_enabled is False


def test_preview_generator_failure_degrades_without_external_provider() -> None:
    class FailingGenerator:
        def generate(self, **_kwargs):
            raise RuntimeError("private object key and provider details")

    storage = FakeObjectStorageProvider(max_proxy_bytes=1024)
    source = _stored_source(storage, b"original-image")
    provider = InternalMediaPreviewProvider(storage=storage, generator=FailingGenerator())

    result = provider.create_preview(
        source=source,
        media_kind="audio",
        metadata={"duration_seconds": 42, "object_key": "secret/key"},
    )

    assert result.status is PreviewStatus.METADATA_FALLBACK
    assert result.error_code == "preview_generation_unavailable"
    assert "private object key" not in repr(result)


def test_preview_rejects_oversized_generated_payload_as_safe_fallback() -> None:
    storage = FakeObjectStorageProvider(max_proxy_bytes=1024)
    source = _stored_source(storage, b"original-image")
    generator = StubPreviewGenerator(
        GeneratedPreview(content=b"x" * 9, content_type="image/webp")
    )
    provider = InternalMediaPreviewProvider(
        storage=storage,
        generator=generator,
        max_preview_bytes=8,
    )

    result = provider.create_preview(source=source, media_kind="image", metadata={})

    assert result.status is PreviewStatus.METADATA_FALLBACK
    assert result.error_code == "preview_payload_too_large"

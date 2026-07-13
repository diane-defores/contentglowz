from __future__ import annotations

from dataclasses import fields, replace
import hashlib
import io

import pytest

from api.services.object_storage import (
    FakeObjectStorageProvider,
    ObjectStorageError,
    StorageLocator,
    UploadMode,
)


def _sha256(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def test_storage_locator_is_provider_neutral_and_redacted() -> None:
    locator = StorageLocator(
        provider="s3",
        namespace="quarantine",
        object_key="private/customer/project/source.mp4",
        version="version-secret",
        checksum_sha256="a" * 64,
    )

    assert {field.name for field in fields(locator)} == {
        "provider",
        "namespace",
        "object_key",
        "version",
        "checksum_sha256",
    }
    assert "url" not in {field.name for field in fields(locator)}
    assert "private/customer" not in repr(locator)
    assert "version-secret" not in repr(locator)
    assert "a" * 64 not in repr(locator)


@pytest.mark.parametrize(
    ("field_name", "value"),
    [
        ("provider", "https://storage.example"),
        ("namespace", "../escape"),
        ("object_key", "https://storage.example/object"),
        ("object_key", "/absolute/object"),
        ("version", "bad\nversion"),
        ("checksum_sha256", "not-a-sha256"),
    ],
)
def test_storage_locator_rejects_unsafe_values(field_name: str, value: str) -> None:
    values = {
        "provider": "s3",
        "namespace": "assets",
        "object_key": "server/generated/object",
        "version": "v1",
        "checksum_sha256": "b" * 64,
    }
    values[field_name] = value

    with pytest.raises(ValueError) as exc_info:
        StorageLocator(**values)

    assert value not in str(exc_info.value)


def test_fake_provider_proxy_upload_stat_range_promote_and_delete() -> None:
    storage = FakeObjectStorageProvider(max_proxy_bytes=1024)
    payload = b"0123456789"
    session = storage.create_upload_session(
        namespace="quarantine",
        content_type="video/mp4",
        expected_size=len(payload),
        checksum_sha256=_sha256(payload),
        mode=UploadMode.PROXY,
    )

    locator = storage.upload_proxy(session=session, source=io.BytesIO(payload))
    stat = storage.stat(locator)

    assert locator.provider == "fake"
    assert stat.size_bytes == len(payload)
    assert stat.checksum_sha256 == _sha256(payload)
    assert storage.read_range(locator, start=2, end=5) == b"2345"

    promoted = storage.promote(
        locator,
        target_namespace="assets",
        delete_source=True,
    )
    assert promoted.namespace == "assets"
    assert storage.read_range(promoted, start=0, end=9) == payload
    with pytest.raises(ObjectStorageError) as missing_source:
        storage.stat(locator)
    assert missing_source.value.code == "object_not_found"

    storage.delete_version(promoted)
    storage.delete_version(promoted)  # Compensation is idempotent.
    with pytest.raises(ObjectStorageError):
        storage.stat(promoted)


def test_fake_provider_multipart_upload_is_opaque_and_deterministic() -> None:
    storage = FakeObjectStorageProvider(min_part_bytes=1, max_part_bytes=10)
    payload = b"abcdef"
    session = storage.create_upload_session(
        namespace="quarantine",
        content_type="audio/mpeg",
        expected_size=len(payload),
        checksum_sha256=_sha256(payload),
        mode=UploadMode.MULTIPART,
    )

    operation = storage.presign_upload_part(
        session=session,
        part_number=1,
        checksum_sha256=_sha256(b"abc"),
        size_bytes=3,
        expires_in=60,
    )
    assert operation.method == "PUT"
    assert operation.url.startswith("https://upload.invalid/")
    assert operation.url not in repr(operation)
    assert operation.headers["x-amz-checksum-sha256"] == _sha256(b"abc")
    assert "object" not in repr(session).lower()

    first = storage.upload_part(session=session, part_number=1, source=b"abc")
    second = storage.upload_part(session=session, part_number=2, source=b"def")
    locator = storage.complete_upload(session=session, parts=(first, second))

    assert storage.read_range(locator, start=0, end=5) == payload
    assert locator.version == "v0001"


def test_fake_provider_can_restore_backend_only_session_state_after_restart() -> None:
    first_instance = FakeObjectStorageProvider(min_part_bytes=1, max_part_bytes=10)
    payload = b"restart-safe"
    session = first_instance.create_upload_session(
        namespace="quarantine",
        content_type="video/mp4",
        expected_size=len(payload),
        checksum_sha256=_sha256(payload),
        mode=UploadMode.MULTIPART,
    )
    private_state = first_instance.export_session_state(session)

    assert private_state["object_key"]
    assert private_state["object_key"] not in repr(private_state)
    assert "upload_id" not in repr(private_state)

    restarted = FakeObjectStorageProvider(min_part_bytes=1, max_part_bytes=10)
    restarted.restore_session(session, private_state)
    restarted.presign_upload_part(
        session=session,
        part_number=1,
        checksum_sha256=_sha256(b"restart-"),
        size_bytes=8,
        expires_in=60,
    )
    first = restarted.upload_part(session=session, part_number=1, source=b"restart-")
    second = restarted.upload_part(session=session, part_number=2, source=b"safe")
    locator = restarted.complete_upload(session=session, parts=(first, second))

    assert restarted.read_range(locator, start=0, end=len(payload) - 1) == payload


def test_fake_provider_rejects_forged_session_and_checksum_without_leaks() -> None:
    storage = FakeObjectStorageProvider(max_proxy_bytes=1024)
    payload = b"private bytes"
    session = storage.create_upload_session(
        namespace="quarantine",
        content_type="image/png",
        expected_size=len(payload),
        checksum_sha256=_sha256(payload),
        mode=UploadMode.PROXY,
    )

    forged = replace(session, expected_size=session.expected_size + 1)
    with pytest.raises(ObjectStorageError) as forged_error:
        storage.upload_proxy(session=forged, source=payload)
    assert forged_error.value.code == "invalid_upload_session"
    assert session.session_id not in str(forged_error.value)

    with pytest.raises(ObjectStorageError) as checksum_error:
        storage.upload_proxy(session=session, source=b"wrong payload")
    assert checksum_error.value.code in {"size_mismatch", "checksum_mismatch"}
    assert "private bytes" not in str(checksum_error.value)


def test_fake_provider_enforces_range_and_upload_bounds() -> None:
    storage = FakeObjectStorageProvider(max_proxy_bytes=4, max_range_bytes=4)

    with pytest.raises(ObjectStorageError) as too_large:
        storage.create_upload_session(
            namespace="quarantine",
            content_type="video/mp4",
            expected_size=5,
            checksum_sha256=_sha256(b"12345"),
            mode=UploadMode.PROXY,
        )
    assert too_large.value.code == "proxy_upload_too_large"

    payload = b"1234"
    session = storage.create_upload_session(
        namespace="quarantine",
        content_type="image/png",
        expected_size=4,
        checksum_sha256=_sha256(payload),
        mode=UploadMode.PROXY,
    )
    locator = storage.upload_proxy(session=session, source=payload)

    with pytest.raises(ObjectStorageError) as invalid_range:
        storage.read_range(locator, start=0, end=4)
    assert invalid_range.value.code == "range_too_large"

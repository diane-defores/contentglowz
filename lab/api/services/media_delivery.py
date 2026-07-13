"""Private, ephemeral media-delivery port separated from object storage."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Mapping, Protocol, runtime_checkable

from api.services.object_storage import StorageLocator


class MediaDeliveryError(RuntimeError):
    """Stable delivery failure without bucket, key, locator or URL details."""

    def __init__(self, *, code: str, message: str, retryable: bool = False) -> None:
        super().__init__(message)
        self.code = code
        self.retryable = retryable

    def __repr__(self) -> str:
        return f"MediaDeliveryError(code={self.code!r}, retryable={self.retryable!r})"


@dataclass(frozen=True, repr=False)
class DeliveryContext:
    """Owned domain context supplied to the mandatory authorization callback."""

    actor_id: str
    project_id: str
    asset_id: str

    def __post_init__(self) -> None:
        for value in (self.actor_id, self.project_id, self.asset_id):
            if not value or len(value) > 256 or any(ord(char) < 32 for char in value):
                raise ValueError("Delivery context identifier is invalid")

    def __repr__(self) -> str:
        return "DeliveryContext(actor_id=<redacted>, project_id=<redacted>, asset_id=<redacted>)"


@dataclass(frozen=True, repr=False)
class EphemeralMediaDelivery:
    """Short-lived transport result; never suitable for durable persistence."""

    url: str = field(repr=False)
    expires_at: datetime
    method: str = "GET"
    headers: Mapping[str, str] = field(default_factory=dict, repr=False)

    def __post_init__(self) -> None:
        if not self.url.startswith("https://"):
            raise ValueError("Media delivery URL must use HTTPS")
        if self.method != "GET":
            raise ValueError("Media delivery method is invalid")
        if self.expires_at.tzinfo is None:
            raise ValueError("Media delivery expiry must be timezone-aware")

    def __repr__(self) -> str:
        return (
            "EphemeralMediaDelivery("
            "url=<redacted>, "
            f"expires_at={self.expires_at.isoformat()!r}, method='GET', headers=<redacted>)"
        )


class DeliveryAuthorizer(Protocol):
    def __call__(self, context: DeliveryContext, locator: StorageLocator) -> bool:
        ...


@runtime_checkable
class MediaDeliveryProvider(Protocol):
    def issue_get(
        self,
        *,
        locator: StorageLocator,
        context: DeliveryContext,
        expires_in: int = 120,
        byte_range: tuple[int, int] | None = None,
    ) -> EphemeralMediaDelivery:
        ...


class S3PresignedMediaDeliveryProvider:
    """Issue short S3 GET URLs only after an injected ownership decision."""

    def __init__(
        self,
        *,
        client: Any,
        bucket: str,
        authorizer: DeliveryAuthorizer,
        max_ttl_seconds: int = 300,
        max_range_bytes: int = 8 * 1024 * 1024,
        clock: Callable[[], datetime] | None = None,
    ) -> None:
        if not bucket or len(bucket) > 255 or _has_control(bucket):
            raise ValueError("Delivery bucket configuration is invalid")
        if max_ttl_seconds < 30 or max_ttl_seconds > 900:
            raise ValueError("Maximum delivery TTL is outside allowed bounds")
        if max_range_bytes <= 0:
            raise ValueError("Maximum delivery range must be positive")
        self._client = client
        self._bucket = bucket
        self._authorizer = authorizer
        self.max_ttl_seconds = max_ttl_seconds
        self.max_range_bytes = max_range_bytes
        self._clock = clock or _utc_now

    def __repr__(self) -> str:
        return "S3PresignedMediaDeliveryProvider(provider='s3', bucket=<redacted>)"

    def issue_get(
        self,
        *,
        locator: StorageLocator,
        context: DeliveryContext,
        expires_in: int = 120,
        byte_range: tuple[int, int] | None = None,
    ) -> EphemeralMediaDelivery:
        _authorize(self._authorizer, context=context, locator=locator)
        _validate_ttl(expires_in, max_ttl_seconds=self.max_ttl_seconds)
        if locator.provider != "s3":
            raise MediaDeliveryError(
                code="unsupported_delivery_provider",
                message="Media delivery provider is unsupported",
            )
        params: dict[str, Any] = {
            "Bucket": self._bucket,
            "Key": locator.object_key,
            "VersionId": locator.version,
        }
        headers: dict[str, str] = {}
        if byte_range is not None:
            range_header = _validate_range(byte_range, max_range_bytes=self.max_range_bytes)
            params["Range"] = range_header
            headers["Range"] = range_header
        try:
            url = self._client.generate_presigned_url(
                "get_object",
                Params=params,
                ExpiresIn=expires_in,
                HttpMethod="GET",
            )
        except Exception:
            raise MediaDeliveryError(
                code="delivery_signing_failed",
                message="Private media delivery could not be created",
                retryable=True,
            ) from None
        try:
            return EphemeralMediaDelivery(
                url=str(url),
                expires_at=self._clock() + timedelta(seconds=expires_in),
                headers=headers,
            )
        except ValueError:
            raise MediaDeliveryError(
                code="invalid_delivery_response",
                message="Private media delivery is unavailable",
                retryable=True,
            ) from None


class FakeMediaDeliveryProvider:
    """Deterministic delivery adapter for domain and ownership tests."""

    def __init__(
        self,
        *,
        authorizer: DeliveryAuthorizer,
        max_ttl_seconds: int = 300,
        max_range_bytes: int = 8 * 1024 * 1024,
        clock: Callable[[], datetime] | None = None,
    ) -> None:
        if max_ttl_seconds < 30 or max_ttl_seconds > 900:
            raise ValueError("Maximum delivery TTL is outside allowed bounds")
        if max_range_bytes <= 0:
            raise ValueError("Maximum delivery range must be positive")
        self._authorizer = authorizer
        self.max_ttl_seconds = max_ttl_seconds
        self.max_range_bytes = max_range_bytes
        self._clock = clock or _utc_now
        self._counter = 0

    def issue_get(
        self,
        *,
        locator: StorageLocator,
        context: DeliveryContext,
        expires_in: int = 120,
        byte_range: tuple[int, int] | None = None,
    ) -> EphemeralMediaDelivery:
        _authorize(self._authorizer, context=context, locator=locator)
        _validate_ttl(expires_in, max_ttl_seconds=self.max_ttl_seconds)
        headers: dict[str, str] = {}
        if byte_range is not None:
            headers["Range"] = _validate_range(
                byte_range,
                max_range_bytes=self.max_range_bytes,
            )
        self._counter += 1
        suffix = f"{self._counter:04d}"
        return EphemeralMediaDelivery(
            url=f"https://delivery.invalid/delivery-{suffix}?token=redacted-test-token-{suffix}",
            expires_at=self._clock() + timedelta(seconds=expires_in),
            headers=headers,
        )


def _authorize(
    authorizer: DeliveryAuthorizer,
    *,
    context: DeliveryContext,
    locator: StorageLocator,
) -> None:
    try:
        allowed = authorizer(context, locator)
    except Exception:
        raise MediaDeliveryError(
            code="delivery_authorization_unavailable",
            message="Media authorization is unavailable",
            retryable=True,
        ) from None
    if allowed is not True:
        raise MediaDeliveryError(code="delivery_forbidden", message="Media delivery is forbidden")


def _validate_ttl(expires_in: int, *, max_ttl_seconds: int) -> None:
    if expires_in < 30 or expires_in > max_ttl_seconds:
        raise MediaDeliveryError(
            code="invalid_delivery_ttl",
            message="Media delivery expiry is outside allowed bounds",
        )


def _validate_range(byte_range: tuple[int, int], *, max_range_bytes: int) -> str:
    if len(byte_range) != 2:
        raise MediaDeliveryError(code="invalid_delivery_range", message="Media delivery range is invalid")
    start, end = byte_range
    if start < 0 or end < start:
        raise MediaDeliveryError(code="invalid_delivery_range", message="Media delivery range is invalid")
    if end - start + 1 > max_range_bytes:
        raise MediaDeliveryError(
            code="delivery_range_too_large",
            message="Media delivery range exceeds its limit",
        )
    return f"bytes={start}-{end}"


def _has_control(value: str) -> bool:
    return any(ord(character) < 32 or ord(character) == 127 for character in value)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


__all__ = [
    "DeliveryAuthorizer",
    "DeliveryContext",
    "EphemeralMediaDelivery",
    "FakeMediaDeliveryProvider",
    "MediaDeliveryError",
    "MediaDeliveryProvider",
    "S3PresignedMediaDeliveryProvider",
]

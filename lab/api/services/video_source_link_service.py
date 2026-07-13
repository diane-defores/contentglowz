"""Bounded public-link metadata intake with SSRF defenses."""

from __future__ import annotations

import html
import ipaddress
import re
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any
from urllib.parse import urljoin, urlparse, urlunparse

import httpx

from api.services.url_safety import AddressResolver, URLSafetyError, validate_public_http_url


MAX_LINK_BYTES = 2 * 1024 * 1024
MAX_REDIRECTS = 5
TOTAL_TIMEOUT_SECONDS = 10.0
TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)
Fetcher = Callable[..., Awaitable[dict[str, Any]]]


class LinkMetadataError(ValueError):
    def __init__(self, code: str, message: str, *, retryable: bool = False) -> None:
        super().__init__(message)
        self.code = code
        self.retryable = retryable


@dataclass(frozen=True, slots=True)
class LinkMetadata:
    canonical_url: str
    hostname: str
    title: str | None
    content_type: str | None


def _canonicalize(url: str) -> str:
    parsed = urlparse(url)
    path = parsed.path or ""
    return urlunparse((parsed.scheme, parsed.netloc, path, "", parsed.query, ""))


def _extract_title(body: bytes) -> str | None:
    sample = body[:MAX_LINK_BYTES].decode("utf-8", errors="ignore")
    match = TITLE_RE.search(sample)
    if not match:
        return None
    title = re.sub(r"\s+", " ", html.unescape(match.group(1))).strip()
    return title[:240] or None


def _is_public_peer(value: Any) -> bool:
    if isinstance(value, tuple) and value:
        value = value[0]
    try:
        return ipaddress.ip_address(str(value)).is_global
    except ValueError:
        return False


async def _default_fetcher(url: str, *, timeout: float, max_bytes: int) -> dict[str, Any]:
    async with httpx.AsyncClient(follow_redirects=False, timeout=timeout) as client:
        async with client.stream(
            "GET",
            url,
            headers={"Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1"},
        ) as response:
            peer = None
            stream = response.extensions.get("network_stream")
            if stream is not None:
                peer = stream.get_extra_info("server_addr") or stream.get_extra_info("peername")
            if peer is not None and not _is_public_peer(peer):
                raise LinkMetadataError("unsafe_url", "This address cannot be fetched.")
            body = bytearray()
            async for chunk in response.aiter_bytes():
                body.extend(chunk)
                if len(body) > max_bytes:
                    raise LinkMetadataError("response_too_large", "The linked page is too large.")
            return {
                "status": response.status_code,
                "url": str(response.url),
                "headers": dict(response.headers),
                "body": bytes(body),
            }


class VideoSourceLinkService:
    def __init__(
        self,
        *,
        resolver: AddressResolver | None = None,
        fetcher: Fetcher | None = None,
    ) -> None:
        self._resolver = resolver
        self._fetcher = fetcher or _default_fetcher

    def validate_url(self, raw_url: str) -> str:
        try:
            return validate_public_http_url(str(raw_url).strip(), resolver=self._resolver)
        except (URLSafetyError, OSError) as exc:
            raise LinkMetadataError("unsafe_url", "This link is not a public HTTP(S) address.") from exc

    async def inspect(self, raw_url: str) -> LinkMetadata:
        current = self.validate_url(raw_url)

        for hop in range(MAX_REDIRECTS + 1):
            try:
                response = await self._fetcher(
                    current,
                    timeout=TOTAL_TIMEOUT_SECONDS,
                    max_bytes=MAX_LINK_BYTES,
                )
            except LinkMetadataError:
                raise
            except (httpx.TimeoutException, httpx.NetworkError, OSError) as exc:
                raise LinkMetadataError(
                    "metadata_unavailable",
                    "Link metadata is temporarily unavailable.",
                    retryable=True,
                ) from exc

            status = int(response.get("status", 0))
            headers = {str(k).lower(): str(v) for k, v in (response.get("headers") or {}).items()}
            if status in {301, 302, 303, 307, 308}:
                location = headers.get("location")
                if not location or hop >= MAX_REDIRECTS:
                    raise LinkMetadataError("redirect_limit", "The link redirects too many times.")
                candidate = urljoin(current, location)
                try:
                    current = validate_public_http_url(candidate, resolver=self._resolver)
                except (URLSafetyError, OSError) as exc:
                    raise LinkMetadataError("unsafe_url", "This redirect cannot be followed.") from exc
                continue

            if status < 200 or status >= 400:
                raise LinkMetadataError(
                    "metadata_unavailable",
                    "Link metadata is temporarily unavailable.",
                    retryable=status >= 500,
                )
            body = bytes(response.get("body") or b"")
            if len(body) > MAX_LINK_BYTES:
                raise LinkMetadataError("response_too_large", "The linked page is too large.")
            final_url = response.get("url") or current
            try:
                final_url = validate_public_http_url(str(final_url), resolver=self._resolver)
            except (URLSafetyError, OSError) as exc:
                raise LinkMetadataError("unsafe_url", "The final address cannot be fetched.") from exc
            canonical = _canonicalize(final_url)
            parsed = urlparse(canonical)
            content_type = headers.get("content-type", "").split(";", 1)[0].strip() or None
            title = _extract_title(body) if content_type in {None, "text/html", "application/xhtml+xml"} else None
            return LinkMetadata(
                canonical_url=canonical,
                hostname=parsed.hostname or "",
                title=title,
                content_type=content_type,
            )

        raise LinkMetadataError("redirect_limit", "The link redirects too many times.")


video_source_link_service = VideoSourceLinkService()

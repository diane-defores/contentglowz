"""Storage descriptor helpers for project asset API responses.

These helpers only classify and redact persisted metadata. They do not upload,
delete, sign, or verify remote Bunny objects.
"""

from __future__ import annotations

from typing import Any, Dict, Optional
from urllib.parse import urlsplit, urlunsplit


def build_project_asset_storage_descriptor(
    *,
    storage_uri: Optional[str],
    status: str,
    media_kind: str,
    mime_type: Optional[str],
) -> Dict[str, Any]:
    """Return a client-safe storage descriptor for a project asset."""

    if status == "local_only":
        return _descriptor(
            state="local_only",
            media_kind=media_kind,
            mime_type=mime_type,
            render_safe=False,
            refresh_required=False,
        )

    if not storage_uri:
        return _descriptor(
            state="missing",
            media_kind=media_kind,
            mime_type=mime_type,
            render_safe=False,
            refresh_required=True,
        )

    parsed = urlsplit(storage_uri)
    scheme = parsed.scheme.lower()
    host = (parsed.netloc or "").lower()

    if scheme == "bunny":
        return _descriptor(
            state="durable_bunny",
            media_kind=media_kind,
            mime_type=mime_type,
            redacted_uri="bunny://<redacted>",
            render_safe=True,
            refresh_required=False,
        )

    if scheme in {"http", "https"}:
        redacted_uri = urlunsplit((parsed.scheme, parsed.netloc, parsed.path, "", ""))
        if _looks_like_bunny_host(host):
            return _descriptor(
                state="durable_bunny_http",
                media_kind=media_kind,
                mime_type=mime_type,
                redacted_uri=redacted_uri,
                render_safe=True,
                refresh_required=bool(parsed.query),
            )
        return _descriptor(
            state="provider_temporary",
            media_kind=media_kind,
            mime_type=mime_type,
            redacted_uri=redacted_uri,
            render_safe=False,
            refresh_required=True,
        )

    return _descriptor(
        state="unsupported_uri",
        media_kind=media_kind,
        mime_type=mime_type,
        render_safe=False,
        refresh_required=True,
    )


def _looks_like_bunny_host(host: str) -> bool:
    return (
        host.endswith(".b-cdn.net")
        or host.endswith(".bunnycdn.com")
        or host == "storage.bunnycdn.com"
    )


def _descriptor(
    *,
    state: str,
    media_kind: str,
    mime_type: Optional[str],
    redacted_uri: Optional[str] = None,
    render_safe: bool,
    refresh_required: bool,
) -> Dict[str, Any]:
    return {
        "state": state,
        "media_kind": media_kind,
        "mime_type": mime_type,
        "redacted_uri": redacted_uri,
        "preview_url": None,
        "playback_url": None,
        "render_safe": render_safe,
        "refresh_required": refresh_required,
    }

"""HMAC-signed token helpers for render artifact access."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
from datetime import UTC, datetime, timedelta
from typing import Any


TOKEN_TTL_HOURS = 24


class RenderArtifactTokenError(ValueError):
    """Raised when an artifact token is missing, invalid, or expired."""


def _urlsafe_b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("utf-8").rstrip("=")


def _urlsafe_b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}".encode("utf-8"))


def _read_signing_key(signing_key: str | None = None) -> str:
    key = (signing_key or os.getenv("RENDER_ARTIFACT_SIGNING_KEY", "")).strip()
    if not key:
        raise RuntimeError("RENDER_ARTIFACT_SIGNING_KEY is required")
    return key


def hash_artifact_path(artifact_path: str) -> str:
    normalized = artifact_path.replace("\\", "/").strip()
    if not normalized:
        raise ValueError("artifact_path must not be empty")
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def _sign_payload(payload_bytes: bytes, signing_key: str) -> str:
    digest = hmac.new(signing_key.encode("utf-8"), payload_bytes, hashlib.sha256).digest()
    return _urlsafe_b64encode(digest)


def issue_artifact_token(
    *,
    job_id: str,
    render_mode: str,
    artifact_path: str,
    timeline_id: str | None = None,
    version_id: str | None = None,
    now: datetime | None = None,
    signing_key: str | None = None,
) -> tuple[str, datetime]:
    key = _read_signing_key(signing_key)
    issued_at = now or datetime.now(UTC)
    expires_at = issued_at + timedelta(hours=TOKEN_TTL_HOURS)

    payload = {
        "job_id": job_id,
        "render_mode": render_mode,
        "artifact_path_hash": hash_artifact_path(artifact_path),
        "exp": int(expires_at.timestamp()),
    }
    if timeline_id:
        payload["timeline_id"] = timeline_id
    if version_id:
        payload["version_id"] = version_id
    payload_bytes = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    encoded_payload = _urlsafe_b64encode(payload_bytes)
    signature = _sign_payload(payload_bytes, key)
    return f"{encoded_payload}.{signature}", expires_at


def verify_artifact_token(
    *,
    token: str,
    job_id: str,
    render_mode: str,
    artifact_path: str,
    timeline_id: str | None = None,
    version_id: str | None = None,
    now: datetime | None = None,
    signing_key: str | None = None,
) -> dict[str, Any]:
    key = _read_signing_key(signing_key)
    if not token or "." not in token:
        raise RenderArtifactTokenError("Invalid artifact token")

    try:
        encoded_payload, presented_signature = token.split(".", 1)
        payload_bytes = _urlsafe_b64decode(encoded_payload)
        expected_signature = _sign_payload(payload_bytes, key)
    except Exception as exc:  # noqa: BLE001
        raise RenderArtifactTokenError("Invalid artifact token") from exc

    if not hmac.compare_digest(expected_signature, presented_signature):
        raise RenderArtifactTokenError("Invalid artifact token")

    try:
        payload = json.loads(payload_bytes.decode("utf-8"))
    except Exception as exc:  # noqa: BLE001
        raise RenderArtifactTokenError("Invalid artifact token") from exc

    if not isinstance(payload, dict):
        raise RenderArtifactTokenError("Invalid artifact token")

    expected_hash = hash_artifact_path(artifact_path)
    if (
        payload.get("job_id") != job_id
        or payload.get("render_mode") != render_mode
        or payload.get("artifact_path_hash") != expected_hash
    ):
        raise RenderArtifactTokenError("Invalid artifact token")
    if timeline_id is not None and payload.get("timeline_id") != timeline_id:
        raise RenderArtifactTokenError("Invalid artifact token")
    if version_id is not None and payload.get("version_id") != version_id:
        raise RenderArtifactTokenError("Invalid artifact token")

    exp_raw = payload.get("exp")
    if not isinstance(exp_raw, int):
        raise RenderArtifactTokenError("Invalid artifact token")

    current_time = now or datetime.now(UTC)
    if int(current_time.timestamp()) >= exp_raw:
        raise RenderArtifactTokenError("Artifact token expired")

    return payload

"""Runtime observability setup for optional Sentry reporting."""

from __future__ import annotations

import logging
import os
from typing import Any

try:
    import sentry_sdk as _sentry_sdk
except ImportError:  # pragma: no cover - exercised through graceful fallback.
    _sentry_sdk = None


logger = logging.getLogger(__name__)
_INITIALIZED = False


def init_sentry() -> bool:
    """Initialize Sentry when SENTRY_DSN is configured."""
    global _INITIALIZED

    dsn = _env_str("SENTRY_DSN")
    if not dsn:
        return False

    if _sentry_sdk is None:
        logger.warning("SENTRY_DSN is configured but sentry-sdk is not installed.")
        return False

    if _INITIALIZED:
        return True

    options: dict[str, Any] = {
        "dsn": dsn,
        "sample_rate": _env_sample_rate("SENTRY_SAMPLE_RATE", default=1.0),
        "traces_sample_rate": _env_sample_rate(
            "SENTRY_TRACES_SAMPLE_RATE",
            default=0.0,
        ),
        "send_default_pii": _env_bool("SENTRY_SEND_DEFAULT_PII", default=True),
        "debug": _env_bool("SENTRY_DEBUG", default=False),
    }

    environment = _first_env_str("SENTRY_ENVIRONMENT", "ENVIRONMENT")
    if environment:
        options["environment"] = environment

    release = _first_env_str(
        "SENTRY_RELEASE",
        "BACKEND_GIT_SHA",
        "RENDER_GIT_COMMIT",
        "GIT_SHA",
    )
    if release:
        options["release"] = release

    _sentry_sdk.init(**options)
    _INITIALIZED = True
    return True


def capture_exception(exc: BaseException) -> str | None:
    """Capture an exception when Sentry is active, otherwise no-op."""
    if not _INITIALIZED or _sentry_sdk is None:
        return None

    try:
        return _sentry_sdk.capture_exception(exc)
    except Exception:
        logger.exception("Failed to capture exception with Sentry.")
        return None


def _env_str(name: str) -> str:
    return (os.getenv(name) or "").strip()


def _first_env_str(*names: str) -> str:
    for name in names:
        value = _env_str(name)
        if value:
            return value
    return ""


def _env_bool(name: str, *, default: bool) -> bool:
    raw = _env_str(name)
    if not raw:
        return default

    value = raw.lower()
    if value in {"1", "true", "yes", "on"}:
        return True
    if value in {"0", "false", "no", "off"}:
        return False

    logger.warning("Ignoring invalid boolean for %s: %s", name, raw)
    return default


def _env_sample_rate(name: str, *, default: float) -> float:
    raw = _env_str(name)
    if not raw:
        return default

    try:
        value = float(raw)
    except ValueError:
        logger.warning("Ignoring invalid sample rate for %s: %s", name, raw)
        return default

    if 0.0 <= value <= 1.0:
        return value

    logger.warning("Ignoring out-of-range sample rate for %s: %s", name, raw)
    return default

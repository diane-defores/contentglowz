"""Lightweight user-agent parser using stdlib only.

Parses device type, browser, and OS from a UA string.
Runs server-side so the tracking JS stays tiny (~600B).
"""

from __future__ import annotations

import re


def parse_ua(ua: str) -> dict[str, str]:
    """Parse a User-Agent string into device, browser, and os.

    Returns {"device": ..., "browser": ..., "os": ...} with "unknown"
    as fallback for each field.
    """
    if not ua:
        return {"device": "unknown", "browser": "unknown", "os": "unknown"}

    return {
        "device": _detect_device(ua),
        "browser": _detect_browser(ua),
        "os": _detect_os(ua),
    }


def _detect_device(ua: str) -> str:
    if "iPad" in ua or ("Android" in ua and "Mobile" not in ua):
        return "tablet"
    if re.search(r"iPhone|iPod|Android.*Mobile|Mobile.*Android|webOS|BlackBerry|Opera Mini|IEMobile", ua):
        return "mobile"
    return "desktop"


def _detect_browser(ua: str) -> str:
    # Order matters: Edge contains "Chrome", Chrome contains "Safari"
    if "Edg/" in ua or "Edge/" in ua:
        return "Edge"
    if "OPR/" in ua or "Opera" in ua:
        return "Opera"
    if "Chrome/" in ua and "Chromium/" not in ua:
        return "Chrome"
    if "Firefox/" in ua:
        return "Firefox"
    if "Safari/" in ua:
        return "Safari"
    return "unknown"


def _detect_os(ua: str) -> str:
    if "iPhone" in ua or "iPad" in ua or "iPod" in ua:
        return "iOS"
    if "Android" in ua:
        return "Android"
    if "Windows" in ua:
        return "Windows"
    if "Macintosh" in ua or "Mac OS" in ua:
        return "macOS"
    if "Linux" in ua:
        return "Linux"
    return "unknown"

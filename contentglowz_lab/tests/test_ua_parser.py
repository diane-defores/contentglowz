"""Unit tests for the lightweight user-agent parser."""

import pytest

from api.services.ua_parser import parse_ua


# ── Device detection ─────────────────────────────


def test_desktop_chrome_windows():
    ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    result = parse_ua(ua)
    assert result["device"] == "desktop"
    assert result["browser"] == "Chrome"
    assert result["os"] == "Windows"


def test_mobile_iphone_safari():
    ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    result = parse_ua(ua)
    assert result["device"] == "mobile"
    assert result["browser"] == "Safari"
    assert result["os"] == "iOS"


def test_mobile_android_chrome():
    ua = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
    result = parse_ua(ua)
    assert result["device"] == "mobile"
    assert result["browser"] == "Chrome"
    assert result["os"] == "Android"


def test_tablet_ipad():
    ua = "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    result = parse_ua(ua)
    assert result["device"] == "tablet"
    assert result["browser"] == "Safari"
    assert result["os"] == "iOS"


def test_tablet_android():
    ua = "Mozilla/5.0 (Linux; Android 13; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    result = parse_ua(ua)
    assert result["device"] == "tablet"  # Android without "Mobile"
    assert result["browser"] == "Chrome"
    assert result["os"] == "Android"


# ── Browser detection ────────────────────────────


def test_edge():
    ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0"
    result = parse_ua(ua)
    assert result["browser"] == "Edge"


def test_firefox():
    ua = "Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0"
    result = parse_ua(ua)
    assert result["browser"] == "Firefox"
    assert result["os"] == "Linux"


def test_opera():
    ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0"
    result = parse_ua(ua)
    assert result["browser"] == "Opera"


def test_macos_safari():
    ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
    result = parse_ua(ua)
    assert result["browser"] == "Safari"
    assert result["os"] == "macOS"


# ── Edge cases ───────────────────────────────────


def test_empty_string():
    result = parse_ua("")
    assert result == {"device": "unknown", "browser": "unknown", "os": "unknown"}


def test_none_like():
    result = parse_ua("")
    assert result["device"] == "unknown"


def test_bot():
    ua = "Googlebot/2.1 (+http://www.google.com/bot.html)"
    result = parse_ua(ua)
    assert result["device"] == "desktop"
    assert result["browser"] == "unknown"
    assert result["os"] == "unknown"

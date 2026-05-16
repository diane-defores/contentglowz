"""Shared validation for URLs that external tools may fetch."""

from __future__ import annotations

import ipaddress
import socket
from collections.abc import Callable, Iterable
from urllib.parse import urlparse, urlunparse


class URLSafetyError(ValueError):
    """Raised when a URL is not safe to fetch through an external provider."""


AddressResolver = Callable[[str, int | None], Iterable[str]]


def _default_resolver(hostname: str, port: int | None) -> Iterable[str]:
    service_port = port or 443
    results = socket.getaddrinfo(hostname, service_port, type=socket.SOCK_STREAM)
    return [result[4][0] for result in results]


def _is_public_ip(value: str) -> bool:
    try:
        ip = ipaddress.ip_address(value)
    except ValueError as exc:
        raise URLSafetyError("URL host did not resolve to a valid IP address.") from exc
    return ip.is_global


def _normalize_hostname(hostname: str) -> str:
    cleaned = hostname.strip().rstrip(".").lower()
    if not cleaned:
        raise URLSafetyError("URL host is required.")
    try:
        return cleaned.encode("idna").decode("ascii")
    except UnicodeError as exc:
        raise URLSafetyError("URL host is not a valid DNS name.") from exc


def validate_public_http_url(
    raw_url: str,
    *,
    resolver: AddressResolver | None = None,
) -> str:
    """Return a normalized HTTP(S) URL only if it resolves to public IPs."""
    raw = raw_url.strip() if isinstance(raw_url, str) else ""
    if not raw:
        raise URLSafetyError("URL is required.")

    parsed = urlparse(raw)
    if parsed.scheme.lower() not in {"http", "https"}:
        raise URLSafetyError("Only http and https URLs are allowed.")
    if parsed.username or parsed.password:
        raise URLSafetyError("URLs with embedded credentials are not allowed.")
    if not parsed.hostname:
        raise URLSafetyError("URL host is required.")

    try:
        port = parsed.port
    except ValueError as exc:
        raise URLSafetyError("URL port is invalid.") from exc

    hostname = _normalize_hostname(parsed.hostname)
    if hostname == "localhost" or hostname.endswith(".localhost"):
        raise URLSafetyError("Localhost URLs are not allowed.")

    try:
        candidate_ip = ipaddress.ip_address(hostname)
    except ValueError:
        addresses = list((resolver or _default_resolver)(hostname, port))
        if not addresses:
            raise URLSafetyError("URL host did not resolve.")
    else:
        addresses = [str(candidate_ip)]

    if not all(_is_public_ip(address) for address in addresses):
        raise URLSafetyError("URL host must resolve only to public IP addresses.")

    netloc = hostname
    if port is not None:
        netloc = f"{netloc}:{port}"
    return urlunparse(
        (
            parsed.scheme.lower(),
            netloc,
            parsed.path or "",
            parsed.params or "",
            parsed.query or "",
            parsed.fragment or "",
        )
    )

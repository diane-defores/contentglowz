"""Google Search Console OAuth + data access service (mock-friendly)."""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import urlencode
from urllib.parse import quote

import httpx


GOOGLE_OAUTH_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_WEBMASTERS_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
GOOGLE_SITES_URL = "https://www.googleapis.com/webmasters/v3/sites"
GOOGLE_SEARCH_ANALYTICS_QUERY_URL = (
    "https://www.googleapis.com/webmasters/v3/sites/{site_url}/searchAnalytics/query"
)
GOOGLE_URL_INSPECTION_URL = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect"


class SearchConsoleServiceError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class SearchConsoleService:
    def _client_id(self) -> str:
        value = (os.getenv("GOOGLE_OAUTH_CLIENT_ID") or "").strip()
        if not value:
            raise SearchConsoleServiceError(
                "Google OAuth is not configured: missing GOOGLE_OAUTH_CLIENT_ID.",
                status_code=503,
            )
        return value

    def _client_secret(self) -> str:
        value = (os.getenv("GOOGLE_OAUTH_CLIENT_SECRET") or "").strip()
        if not value:
            raise SearchConsoleServiceError(
                "Google OAuth is not configured: missing GOOGLE_OAUTH_CLIENT_SECRET.",
                status_code=503,
            )
        return value

    def resolve_redirect_uri(self, callback_url: str) -> str:
        configured = (os.getenv("GOOGLE_OAUTH_REDIRECT_URI") or "").strip()
        return configured or callback_url

    def build_authorize_url(
        self,
        *,
        state: str,
        redirect_uri: str,
    ) -> str:
        query = urlencode(
            {
                "client_id": self._client_id(),
                "redirect_uri": redirect_uri,
                "response_type": "code",
                "scope": GOOGLE_WEBMASTERS_SCOPE,
                "access_type": "offline",
                "prompt": "consent",
                "include_granted_scopes": "true",
                "state": state,
            }
        )
        return f"{GOOGLE_OAUTH_AUTHORIZE_URL}?{query}"

    async def exchange_code_for_tokens(
        self,
        *,
        code: str,
        redirect_uri: str,
    ) -> dict[str, Any]:
        payload = {
            "code": code,
            "client_id": self._client_id(),
            "client_secret": self._client_secret(),
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(GOOGLE_OAUTH_TOKEN_URL, data=payload)
        if resp.status_code >= 400:
            raise SearchConsoleServiceError("Failed to exchange Google OAuth code.", 400)
        body = resp.json()
        if not body.get("access_token"):
            raise SearchConsoleServiceError("OAuth callback did not return an access token.", 400)
        now = datetime.now(timezone.utc)
        expires_in = int(body.get("expires_in") or 3600)
        return {
            "access_token": body.get("access_token"),
            "refresh_token": body.get("refresh_token"),
            "scope": body.get("scope", ""),
            "token_type": body.get("token_type", "Bearer"),
            "expires_at": (now + timedelta(seconds=expires_in)).isoformat(),
        }

    async def refresh_access_token(self, refresh_token: str) -> dict[str, Any]:
        payload = {
            "client_id": self._client_id(),
            "client_secret": self._client_secret(),
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        }
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(GOOGLE_OAUTH_TOKEN_URL, data=payload)
        if resp.status_code >= 400:
            raise SearchConsoleServiceError("Failed to refresh Google access token.", 401)
        body = resp.json()
        access_token = body.get("access_token")
        if not access_token:
            raise SearchConsoleServiceError("Google token refresh response is missing access_token.", 401)
        now = datetime.now(timezone.utc)
        expires_in = int(body.get("expires_in") or 3600)
        return {
            "access_token": access_token,
            "scope": body.get("scope", ""),
            "token_type": body.get("token_type", "Bearer"),
            "expires_at": (now + timedelta(seconds=expires_in)).isoformat(),
        }

    async def fetch_user_email(self, access_token: str) -> str | None:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if resp.status_code >= 400:
            return None
        body = resp.json()
        email = body.get("email")
        return str(email) if email else None

    async def list_properties(self, access_token: str) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(
                GOOGLE_SITES_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if resp.status_code >= 400:
            raise SearchConsoleServiceError("Unable to list Search Console properties.", 409)
        body = resp.json() if isinstance(resp.json(), dict) else {}
        entries = body.get("siteEntry") or []
        if not isinstance(entries, list):
            return []
        return [entry for entry in entries if isinstance(entry, dict)]

    async def query_search_analytics(
        self,
        *,
        access_token: str,
        property_url: str,
        start_date: str,
        end_date: str,
        dimensions: list[str],
        row_limit: int = 25,
    ) -> list[dict[str, Any]]:
        endpoint = GOOGLE_SEARCH_ANALYTICS_QUERY_URL.format(site_url=quote(property_url, safe=""))
        payload = {
            "startDate": start_date,
            "endDate": end_date,
            "dimensions": dimensions,
            "rowLimit": row_limit,
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                endpoint,
                headers={"Authorization": f"Bearer {access_token}"},
                json=payload,
            )
        if resp.status_code >= 400:
            raise SearchConsoleServiceError("Search Analytics query failed.", 409)
        body = resp.json() if isinstance(resp.json(), dict) else {}
        rows = body.get("rows") or []
        return rows if isinstance(rows, list) else []

    async def inspect_url(
        self,
        *,
        access_token: str,
        property_url: str,
        page_url: str,
    ) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                GOOGLE_URL_INSPECTION_URL,
                headers={"Authorization": f"Bearer {access_token}"},
                json={"inspectionUrl": page_url, "siteUrl": property_url},
            )
        if resp.status_code >= 400:
            raise SearchConsoleServiceError("URL Inspection failed.", 409)
        return resp.json() if isinstance(resp.json(), dict) else {}


search_console_service = SearchConsoleService()

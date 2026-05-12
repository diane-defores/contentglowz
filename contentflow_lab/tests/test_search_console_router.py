from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

from api.models.search_console import (
    SearchConsoleIngestOpportunityItem,
    SearchConsoleIngestRequest,
    SearchConsolePropertyRequest,
)
from api.routers import search_console as router
from api.services.search_console_service import SearchConsoleServiceError


def test_search_console_router_exposes_spec_oauth_and_disconnect_paths():
    routes = {
        (route.path, frozenset(route.methods or set()))
        for route in router.router.routes
    }

    assert ("/api/search-console/oauth/start", frozenset({"POST"})) in routes
    assert ("/api/search-console/oauth/connect", frozenset({"GET"})) in routes
    assert ("/api/search-console/properties", frozenset({"GET"})) in routes
    assert ("/api/search-console/connection", frozenset({"DELETE"})) in routes
    assert ("/api/search-console/disconnect", frozenset({"POST"})) in routes


@pytest.mark.asyncio
async def test_start_oauth_requires_work_domain(monkeypatch):
    monkeypatch.setattr(router, "require_owned_project_id", AsyncMock(return_value="project-1"))
    monkeypatch.setattr(
        router.user_data_store,
        "list_work_domains",
        AsyncMock(return_value=[]),
    )
    request = SimpleNamespace(url_for=lambda _name: "https://api.example.com/api/search-console/oauth/callback")
    with pytest.raises(HTTPException) as exc:
        await router.start_oauth(
            request=request,
            projectId="project-1",
            current_user=SimpleNamespace(user_id="user-1"),
        )
    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_start_oauth_returns_authorize_url(monkeypatch):
    monkeypatch.setattr(router, "require_owned_project_id", AsyncMock(return_value="project-1"))
    monkeypatch.setattr(
        router.user_data_store,
        "list_work_domains",
        AsyncMock(return_value=[{"domain": "example.com"}]),
    )
    monkeypatch.setattr(
        router.search_console_store,
        "create_oauth_state",
        AsyncMock(
            return_value={
                "state": "abc",
                "expiresAt": None,
            }
        ),
    )
    monkeypatch.setattr(router.search_console_service, "resolve_redirect_uri", lambda _: "https://cb")
    monkeypatch.setattr(router.search_console_service, "build_authorize_url", lambda **_: "https://oauth")
    request = SimpleNamespace(url_for=lambda _name: "https://api.example.com/api/search-console/oauth/callback")

    response = await router.start_oauth(
        request=request,
        projectId="project-1",
        current_user=SimpleNamespace(user_id="user-1"),
    )
    assert response.authorize_url == "https://oauth"
    assert response.state == "abc"


@pytest.mark.asyncio
async def test_oauth_callback_auto_matches_project_property(monkeypatch):
    monkeypatch.setattr(
        router.search_console_store,
        "consume_oauth_state",
        AsyncMock(return_value={"userId": "user-1", "projectId": "project-1"}),
    )
    monkeypatch.setattr(router.search_console_service, "resolve_redirect_uri", lambda _: "https://cb")
    monkeypatch.setattr(
        router.search_console_service,
        "exchange_code_for_tokens",
        AsyncMock(
            return_value={
                "access_token": "access-token",
                "refresh_token": "refresh-token",
                "scope": "https://www.googleapis.com/auth/webmasters.readonly",
                "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
            }
        ),
    )
    monkeypatch.setattr(router.search_console_service, "fetch_user_email", AsyncMock(return_value="owner@example.com"))
    monkeypatch.setattr(
        router.user_data_store,
        "list_work_domains",
        AsyncMock(return_value=[{"domain": "https://www.example.com"}]),
    )
    monkeypatch.setattr(
        router.search_console_service,
        "list_properties",
        AsyncMock(
            return_value=[
                {"siteUrl": "sc-domain:other.com"},
                {"siteUrl": "sc-domain:example.com"},
                {"siteUrl": "https://www.example.com/"},
            ]
        ),
    )
    upsert_connection = AsyncMock()
    set_status = AsyncMock()
    monkeypatch.setattr(router.search_console_store, "upsert_connection", upsert_connection)
    monkeypatch.setattr(router.search_console_store, "set_connection_status", set_status)
    request = SimpleNamespace(url_for=lambda _name: "https://api.example.com/api/search-console/oauth/callback")

    response = await router.oauth_callback(request=request, code="code", state="state")

    assert response.status == "valid"
    assert response.property_url == "sc-domain:example.com"
    assert "matched automatically" in (response.message or "")
    assert upsert_connection.await_args.kwargs["property_url"] == "sc-domain:example.com"
    assert upsert_connection.await_args.kwargs["status"] == "valid"
    assert set_status.await_args.kwargs["last_sync_status"] == "valid"


@pytest.mark.asyncio
async def test_list_properties_marks_project_domain_matches(monkeypatch):
    monkeypatch.setattr(router, "require_owned_project_id", AsyncMock(return_value="project-1"))
    monkeypatch.setattr(
        router.user_data_store,
        "list_work_domains",
        AsyncMock(return_value=[{"domain": "https://www.example.com"}]),
    )
    monkeypatch.setattr(
        router,
        "_get_valid_access_token",
        AsyncMock(return_value=("access-token", {})),
    )
    monkeypatch.setattr(
        router.search_console_service,
        "list_properties",
        AsyncMock(
            return_value=[
                {"siteUrl": "sc-domain:other.com", "permissionLevel": "siteOwner"},
                {"siteUrl": "sc-domain:example.com", "permissionLevel": "siteFullUser"},
            ]
        ),
    )

    response = await router.list_properties(
        projectId="project-1",
        current_user=SimpleNamespace(user_id="user-1"),
    )

    assert response.items[0].site_url == "sc-domain:example.com"
    assert response.items[0].matches_project_domain is True
    assert response.items[1].matches_project_domain is False


@pytest.mark.asyncio
async def test_set_property_rejects_inaccessible_property(monkeypatch):
    monkeypatch.setattr(router, "require_owned_project_id", AsyncMock(return_value="project-1"))
    monkeypatch.setattr(
        router.user_data_store,
        "list_work_domains",
        AsyncMock(return_value=[{"domain": "example.com"}]),
    )
    monkeypatch.setattr(
        router.search_console_store,
        "get_connection_token_payload",
        AsyncMock(
            return_value={
                "access_token": "access-token",
                "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
            }
        ),
    )
    monkeypatch.setattr(
        router.search_console_service,
        "list_properties",
        AsyncMock(return_value=[{"siteUrl": "sc-domain:other.com"}]),
    )
    set_status = AsyncMock()
    upsert_connection = AsyncMock()
    monkeypatch.setattr(router.search_console_store, "set_connection_status", set_status)
    monkeypatch.setattr(router.search_console_store, "upsert_connection", upsert_connection)

    with pytest.raises(HTTPException) as exc:
        await router.set_property(
            SearchConsolePropertyRequest(
                projectId="project-1",
                propertyUrl="sc-domain:example.com",
            ),
            current_user=SimpleNamespace(user_id="user-1"),
        )

    assert exc.value.status_code == 409
    upsert_connection.assert_not_awaited()
    set_status.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_valid_access_token_refreshes_expired_token(monkeypatch):
    monkeypatch.setattr(
        router.search_console_store,
        "get_connection_token_payload",
        AsyncMock(
            return_value={
                "access_token": "old-token",
                "refresh_token": "refresh-token",
                "expires_at": (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat(),
            }
        ),
    )
    monkeypatch.setattr(
        router.search_console_service,
        "refresh_access_token",
        AsyncMock(return_value={"access_token": "new-token", "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()}),
    )
    set_tokens = AsyncMock()
    monkeypatch.setattr(router.search_console_store, "set_connection_tokens", set_tokens)

    access_token, payload = await router._get_valid_access_token("user-1", "project-1")

    assert access_token == "new-token"
    assert payload["refresh_token"] == "refresh-token"
    set_tokens.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_valid_access_token_marks_revoked_refresh_invalid(monkeypatch):
    monkeypatch.setattr(
        router.search_console_store,
        "get_connection_token_payload",
        AsyncMock(
            return_value={
                "access_token": "old-token",
                "refresh_token": "refresh-token",
                "expires_at": (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat(),
            }
        ),
    )
    monkeypatch.setattr(
        router.search_console_service,
        "refresh_access_token",
        AsyncMock(side_effect=SearchConsoleServiceError("Refresh token revoked.", 401)),
    )
    set_status = AsyncMock()
    monkeypatch.setattr(router.search_console_store, "set_connection_status", set_status)

    with pytest.raises(HTTPException) as exc:
        await router._get_valid_access_token("user-1", "project-1")

    assert exc.value.status_code == 401
    assert set_status.await_args.kwargs["status"] == "invalid"
    assert "Reconnect" in set_status.await_args.kwargs["last_sync_message"]


@pytest.mark.asyncio
async def test_sync_degrades_when_url_inspection_quota_fails(monkeypatch):
    monkeypatch.setattr(router, "require_owned_project_id", AsyncMock(return_value="project-1"))
    monkeypatch.setattr(
        router.search_console_store,
        "get_connection",
        AsyncMock(return_value={"propertyUrl": "sc-domain:example.com"}),
    )
    monkeypatch.setattr(
        router.search_console_store,
        "get_connection_token_payload",
        AsyncMock(
            return_value={
                "access_token": "access-token",
                "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
            }
        ),
    )
    monkeypatch.setattr(
        router.search_console_service,
        "query_search_analytics",
        AsyncMock(
            side_effect=[
                [
                    {
                        "keys": ["https://example.com/a"],
                        "clicks": 2,
                        "impressions": 200,
                        "ctr": 0.01,
                        "position": 9.4,
                    }
                ],
                [{"keys": ["example query"], "clicks": 0, "impressions": 100, "ctr": 0.0}],
            ]
        ),
    )
    monkeypatch.setattr(
        router.search_console_service,
        "inspect_url",
        AsyncMock(side_effect=SearchConsoleServiceError("URL Inspection quota exhausted.", 409)),
    )
    upsert_snapshot = AsyncMock()
    set_status = AsyncMock()
    monkeypatch.setattr(router.search_console_store, "upsert_snapshot", upsert_snapshot)
    monkeypatch.setattr(router.search_console_store, "set_connection_status", set_status)
    monkeypatch.setattr(router, "get_summary", AsyncMock(return_value=SimpleNamespace(ok=True)))

    response = await router.sync(
        projectId="project-1",
        period="30d",
        current_user=SimpleNamespace(user_id="user-1"),
    )

    assert response.ok is True
    assert upsert_snapshot.await_args.kwargs["status"] == "degraded"
    payload = upsert_snapshot.await_args.kwargs["google_payload"]
    assert payload["metrics"]["inspected_pages"] == 0
    assert payload["opportunities"]
    assert set_status.await_args.kwargs["status"] == "degraded"
    assert "URL Inspection" in set_status.await_args.kwargs["last_sync_message"]


@pytest.mark.asyncio
async def test_disconnect_clears_tokens_without_deleting_snapshot_context(monkeypatch):
    monkeypatch.setattr(router, "require_owned_project_id", AsyncMock(return_value="project-1"))
    clear_tokens = AsyncMock()
    monkeypatch.setattr(router.search_console_store, "clear_connection_tokens", clear_tokens)
    monkeypatch.setattr(
        router,
        "_build_status",
        AsyncMock(return_value=SimpleNamespace(project_id="project-1", connected=False, status="disconnected")),
    )

    response = await router.disconnect(
        projectId="project-1",
        current_user=SimpleNamespace(user_id="user-1"),
    )

    clear_tokens.assert_awaited_once_with("user-1", "project-1")
    assert response.status == "disconnected"


@pytest.mark.asyncio
async def test_summary_marks_cached_google_snapshot_stale_after_disconnect(monkeypatch):
    monkeypatch.setattr(router, "require_owned_project_id", AsyncMock(return_value="project-1"))
    monkeypatch.setattr(
        router.search_console_store,
        "get_connection",
        AsyncMock(
            return_value={
                "propertyUrl": "sc-domain:example.com",
                "status": "disconnected",
            }
        ),
    )
    monkeypatch.setattr(
        router.search_console_store,
        "get_snapshot",
        AsyncMock(
            return_value={
                "isPartial": False,
                "syncedAt": datetime.now(timezone.utc),
                "googleSearchPayload": {
                    "summary": "Cached Search Console summary.",
                    "metrics": {"organic_clicks": 12},
                    "topPages": [],
                    "topQueries": [],
                    "issues": [],
                    "opportunities": [],
                },
            }
        ),
    )
    monkeypatch.setattr(router, "_require_project_domains", AsyncMock(return_value=["example.com"]))
    monkeypatch.setattr(router.analytics_store, "get_summary", AsyncMock(return_value={"totalViews": 0, "uniquePages": 0}))
    monkeypatch.setattr(router.analytics_store, "get_top_pages", AsyncMock(return_value=[]))

    response = await router.get_summary(
        projectId="project-1",
        period="30d",
        current_user=SimpleNamespace(user_id="user-1"),
    )

    assert response.google_search.stale is True
    assert response.google_search.metrics["organic_clicks"] == 12


@pytest.mark.asyncio
async def test_ingest_opportunities_dedupes(monkeypatch):
    monkeypatch.setattr(router, "require_owned_project_id", AsyncMock(return_value="project-1"))
    existing = [
        {
            "raw_data": {
                "reason": "low_ctr_high_impressions",
                "period": "30d",
                "target_url": "https://example.com/a",
                "target_query": None,
            }
        }
    ]
    fake_status = SimpleNamespace(
        list_ideas=lambda **_: (existing, 1),
        create_idea=MagicMock(),
    )
    monkeypatch.setattr(router, "get_status_service", lambda: fake_status)
    payload = SearchConsoleIngestRequest(
        project_id="project-1",
        opportunities=[
            SearchConsoleIngestOpportunityItem(
                reason="low_ctr_high_impressions",
                period="30d",
                title="Improve A",
                priorityScore=10.0,
                targetUrl="https://example.com/a",
                summary="x",
                evidence={},
            ),
            SearchConsoleIngestOpportunityItem(
                reason="page_two_opportunity",
                period="30d",
                title="Improve B",
                priorityScore=12.0,
                targetUrl="https://example.com/b",
                summary="y",
                evidence={},
            ),
        ],
    )
    response = await router.ingest_opportunities(payload, current_user=SimpleNamespace(user_id="user-1"))
    assert response.ingested == 1
    assert response.skipped == 1

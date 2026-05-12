"""Project-scoped Google Search Console OAuth and SEO intelligence endpoints."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from api.dependencies.auth import CurrentUser, require_current_user
from api.dependencies.ownership import require_owned_project_id
from api.models.search_console import (
    SearchConsoleConnectionStatus,
    SearchConsoleIngestRequest,
    SearchConsoleIngestResponse,
    SearchConsoleOAuthCallbackResponse,
    SearchConsoleOAuthStartResponse,
    SearchConsoleOpportunity,
    SearchConsoleOpportunityResponse,
    SearchConsoleProperty,
    SearchConsolePropertyListResponse,
    SearchConsolePropertyRequest,
    SearchConsoleSiteTrafficSection,
    SearchConsoleSourceSection,
    SearchConsoleSummaryResponse,
    SearchConsoleTopRow,
)
from api.services.analytics_store import analytics_store
from api.services.search_console_service import SearchConsoleServiceError, search_console_service
from api.services.search_console_store import search_console_store
from api.services.user_data_store import user_data_store
from status import get_status_service

router = APIRouter(prefix="/api/search-console", tags=["Search Console"])

_VALID_PERIODS = {"today": 1, "7d": 7, "30d": 30, "90d": 90, "6m": 180}


def _raise_service_error(exc: SearchConsoleServiceError) -> None:
    raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


def _period_window(period: str) -> tuple[datetime, datetime]:
    if period not in _VALID_PERIODS:
        raise HTTPException(status_code=400, detail="Unsupported period")
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=_VALID_PERIODS[period])
    return start, end


def _to_date(d: datetime) -> str:
    return d.date().isoformat()


def _normalize_property(raw: str) -> str:
    value = raw.strip()
    if value.startswith("sc-domain:"):
        return value
    if not value.startswith("http://") and not value.startswith("https://"):
        value = f"https://{value}"
    return value.rstrip("/") + "/"


def _domain_host(raw: str) -> str:
    value = raw.strip().lower()
    if value.startswith("sc-domain:"):
        return value.replace("sc-domain:", "", 1).strip().strip("/")
    for prefix in ("https://", "http://"):
        if value.startswith(prefix):
            value = value[len(prefix):]
    return value.split("/")[0].removeprefix("www.")


def _property_matches_domains(site_url: str, domains: list[str]) -> bool:
    property_host = _domain_host(site_url)
    if not property_host:
        return False
    for domain in domains:
        host = _domain_host(domain)
        if not host:
            continue
        if property_host == host or host.endswith(f".{property_host}") or property_host.endswith(f".{host}"):
            return True
    return False


def _property_match_rank(site_url: str, domains: list[str]) -> int | None:
    if not _property_matches_domains(site_url, domains):
        return None
    property_host = _domain_host(site_url)
    domain_hosts = {_domain_host(domain) for domain in domains if _domain_host(domain)}
    exact_host = property_host in domain_hosts
    is_domain_property = site_url.strip().lower().startswith("sc-domain:")
    if is_domain_property and exact_host:
        return 0
    if exact_host:
        return 1
    if is_domain_property:
        return 2
    return 3


async def _require_project_domains(user_id: str, project_id: str) -> list[str]:
    rows = await user_data_store.list_work_domains(user_id, project_id)
    if not rows:
        raise HTTPException(
            status_code=409,
            detail="Connect a domain to this project before connecting Search Console.",
        )
    return [str(row.get("domain", "")).strip() for row in rows if row.get("domain")]


def _property_from_site(site: dict[str, Any], domains: list[str]) -> SearchConsoleProperty | None:
    site_url = str(site.get("siteUrl") or "").strip()
    if not site_url:
        return None
    return SearchConsoleProperty(
        site_url=site_url,
        permission_level=str(site.get("permissionLevel") or "") or None,
        display_name=site_url,
        matches_project_domain=_property_matches_domains(site_url, domains),
    )


def _auto_matched_property(sites: list[dict[str, Any]], domains: list[str]) -> SearchConsoleProperty | None:
    properties = [
        prop
        for prop in (_property_from_site(site, domains) for site in sites)
        if prop is not None and prop.matches_project_domain
    ]
    if not properties:
        return None
    def _rank(item: SearchConsoleProperty) -> int:
        rank = _property_match_rank(item.site_url, domains)
        return 99 if rank is None else rank

    properties.sort(
        key=lambda item: (
            _rank(item),
            item.site_url,
        )
    )
    return properties[0]


async def _build_status(user_id: str, project_id: str) -> SearchConsoleConnectionStatus:
    connection = await search_console_store.get_connection(user_id, project_id)
    if not connection:
        return SearchConsoleConnectionStatus(
            project_id=project_id,
            connected=False,
            status="missing",
            scopes=[],
            validation_status="missing",
        )
    token_payload = await search_console_store.get_connection_token_payload(user_id, project_id)
    scopes = connection.get("scopes") or []
    token_expires_at = None
    if token_payload and token_payload.get("expires_at"):
        try:
            token_expires_at = datetime.fromisoformat(str(token_payload["expires_at"]))
        except ValueError:
            token_expires_at = None
    return SearchConsoleConnectionStatus(
        project_id=project_id,
        connected=bool(token_payload),
        status=connection.get("status") or "unknown",
        property_url=connection.get("propertyUrl"),
        property_label=connection.get("propertyUrl"),
        account_email=connection.get("accountEmail"),
        scopes=scopes if isinstance(scopes, list) else [],
        validation_status=connection.get("lastSyncStatus") or "unknown",
        connected_at=connection.get("connectedAt"),
        synced_at=connection.get("syncedAt"),
        last_sync_status=connection.get("lastSyncStatus"),
        last_sync_message=connection.get("lastSyncMessage"),
        token_expires_at=token_expires_at,
    )


async def _get_valid_access_token(user_id: str, project_id: str) -> tuple[str, dict[str, Any]]:
    token_payload = await search_console_store.get_connection_token_payload(user_id, project_id)
    if not token_payload:
        raise HTTPException(status_code=409, detail="Search Console is not connected for this project.")
    access_token = token_payload.get("access_token")
    refresh_token = token_payload.get("refresh_token")
    expires_at = token_payload.get("expires_at")
    expired = False
    if expires_at:
        try:
            expired = datetime.fromisoformat(str(expires_at)) <= datetime.now(timezone.utc) + timedelta(seconds=30)
        except ValueError:
            expired = False
    if access_token and not expired:
        return str(access_token), token_payload
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Search Console tokens are expired or revoked.")
    try:
        refreshed = await search_console_service.refresh_access_token(str(refresh_token))
    except SearchConsoleServiceError as exc:
        await search_console_store.set_connection_status(
            user_id,
            project_id,
            status="invalid",
            last_sync_status="invalid",
            last_sync_message="Token refresh failed. Reconnect Google Search Console.",
        )
        _raise_service_error(exc)
    merged = {**token_payload, **refreshed, "refresh_token": refresh_token}
    await search_console_store.set_connection_tokens(user_id, project_id, merged)
    return str(merged["access_token"]), merged


def _aggregate_rows(rows: list[dict[str, Any]], key_name: str) -> list[SearchConsoleTopRow]:
    out: list[SearchConsoleTopRow] = []
    for row in rows:
        keys = row.get("keys") or []
        key = str(keys[0]) if keys else ""
        clicks = int(row.get("clicks") or 0)
        impressions = int(row.get("impressions") or 0)
        ctr = float(row.get("ctr") or 0.0)
        position = float(row.get("position")) if row.get("position") is not None else None
        payload = {
            "key": key,
            "clicks": clicks,
            "impressions": impressions,
            "ctr": ctr,
            "position": position,
        }
        if key_name == "url":
            payload["url"] = key
        else:
            payload["query"] = key
        out.append(SearchConsoleTopRow(**payload))
    return out


def _opportunities_from_rows(
    *,
    period: str,
    top_pages: list[SearchConsoleTopRow],
    top_queries: list[SearchConsoleTopRow],
) -> list[SearchConsoleOpportunity]:
    items: list[SearchConsoleOpportunity] = []
    for page in top_pages:
        if page.impressions >= 100 and page.ctr < 0.02:
            items.append(
                SearchConsoleOpportunity(
                    reason="low_ctr_high_impressions",
                    period=period,
                    title=f"Improve CTR for {page.url or page.key}",
                    confidence=0.8,
                    priority_score=min(100.0, float(page.impressions) / 10.0),
                    target_url=page.url,
                    summary="This page has high impressions but low organic CTR.",
                    evidence={
                        "source": "search_console",
                        "clicks": page.clicks,
                        "impressions": page.impressions,
                        "ctr": page.ctr,
                    },
                )
            )
        if page.position is not None and 8.0 <= page.position <= 20.0:
            items.append(
                SearchConsoleOpportunity(
                    reason="page_two_opportunity",
                    period=period,
                    title=f"Push {page.url or page.key} into top 10",
                    confidence=0.75,
                    priority_score=65.0,
                    target_url=page.url,
                    summary="Ranking is close to page one and can likely improve with targeted optimization.",
                    evidence={
                        "source": "search_console",
                        "position": page.position,
                        "impressions": page.impressions,
                    },
                )
            )
    for query in top_queries:
        if query.impressions >= 80 and query.clicks <= 1:
            items.append(
                SearchConsoleOpportunity(
                    reason="query_without_targeted_content",
                    period=period,
                    title=f"Create or expand content for query: {query.query or query.key}",
                    confidence=0.7,
                    priority_score=55.0,
                    target_query=query.query,
                    summary="Search demand appears but clicks are weak, suggesting intent/content mismatch.",
                    evidence={
                        "source": "search_console",
                        "impressions": query.impressions,
                        "clicks": query.clicks,
                        "query": query.query,
                    },
                )
            )
    return items[:30]


async def _sample_url_inspections(
    *,
    access_token: str,
    property_url: str,
    pages: list[SearchConsoleTopRow],
    limit: int = 5,
) -> tuple[list[dict[str, Any]], int, str | None]:
    issues: list[dict[str, Any]] = []
    inspected = 0
    degraded_message: str | None = None
    seen: set[str] = set()
    candidates = [
        page.url
        for page in pages
        if page.url and page.url.startswith(("http://", "https://"))
    ]
    for page_url in candidates:
        if page_url in seen:
            continue
        seen.add(page_url)
        if inspected >= limit:
            break
        try:
            inspection = await search_console_service.inspect_url(
                access_token=access_token,
                property_url=property_url,
                page_url=page_url,
            )
        except SearchConsoleServiceError as exc:
            degraded_message = f"URL Inspection partially skipped: {exc.message}"
            break
        inspected += 1
        result = inspection.get("inspectionResult") if isinstance(inspection, dict) else {}
        index_status = result.get("indexStatusResult") if isinstance(result, dict) else {}
        if not isinstance(index_status, dict):
            continue
        verdict = str(index_status.get("verdict") or "").upper()
        coverage_state = str(index_status.get("coverageState") or "").strip()
        indexing_state = str(index_status.get("indexingState") or "").strip()
        google_canonical = str(index_status.get("googleCanonical") or "").strip()
        user_canonical = str(index_status.get("userCanonical") or "").strip()
        if verdict and verdict not in {"PASS", "VERDICT_UNSPECIFIED"}:
            issues.append(
                {
                    "source": "search_console",
                    "type": "indexation_problem",
                    "url": page_url,
                    "verdict": verdict,
                    "coverageState": coverage_state,
                    "indexingState": indexing_state,
                }
            )
        if google_canonical and user_canonical and google_canonical != user_canonical:
            issues.append(
                {
                    "source": "search_console",
                    "type": "canonical_mismatch",
                    "url": page_url,
                    "googleCanonical": google_canonical,
                    "userCanonical": user_canonical,
                }
            )
    return issues, inspected, degraded_message


@router.post("/oauth/start", response_model=SearchConsoleOAuthStartResponse)
@router.get("/oauth/connect", response_model=SearchConsoleOAuthStartResponse)
async def start_oauth(
    request: Request,
    projectId: str = Query(...),
    current_user: CurrentUser = Depends(require_current_user),
) -> SearchConsoleOAuthStartResponse:
    await require_owned_project_id(projectId, current_user)
    await _require_project_domains(current_user.user_id, projectId)
    try:
        state_row = await search_console_store.create_oauth_state(current_user.user_id, projectId)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    try:
        callback = str(request.url_for("search_console_oauth_callback"))
        redirect_uri = search_console_service.resolve_redirect_uri(callback)
        authorize_url = search_console_service.build_authorize_url(
            state=state_row["state"], redirect_uri=redirect_uri
        )
    except SearchConsoleServiceError as exc:
        _raise_service_error(exc)
    return SearchConsoleOAuthStartResponse(
        authorize_url=authorize_url,
        state=state_row["state"],
        expires_at=state_row.get("expiresAt"),
    )


@router.get("/oauth/callback", name="search_console_oauth_callback", response_model=SearchConsoleOAuthCallbackResponse)
async def oauth_callback(
    request: Request,
    code: str = Query(...),
    state: str = Query(...),
) -> SearchConsoleOAuthCallbackResponse:
    state_row = await search_console_store.consume_oauth_state(state)
    if not state_row:
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state.")
    user_id = str(state_row["userId"])
    project_id = str(state_row["projectId"])
    try:
        callback = str(request.url_for("search_console_oauth_callback"))
        redirect_uri = search_console_service.resolve_redirect_uri(callback)
        token_payload = await search_console_service.exchange_code_for_tokens(code=code, redirect_uri=redirect_uri)
        access_token = str(token_payload["access_token"])
        account_email = await search_console_service.fetch_user_email(access_token)
        scopes = [s for s in str(token_payload.get("scope", "")).split(" ") if s]
        domains = await _require_project_domains(user_id, project_id)
        property_url = None
        status = "connected"
        last_sync_status = "property_missing"
        message = "Google Search Console connected. No compatible property matched this project domain."
        try:
            matched_property = _auto_matched_property(
                await search_console_service.list_properties(access_token),
                domains,
            )
        except SearchConsoleServiceError:
            matched_property = None
            status = "degraded"
            last_sync_status = "degraded"
            message = "Google Search Console connected, but properties could not be listed."
        if matched_property is not None:
            property_url = matched_property.site_url
            status = "valid"
            last_sync_status = "valid"
            message = "Google Search Console property matched automatically from the project domain."
        await search_console_store.upsert_connection(
            user_id,
            project_id,
            property_url=property_url,
            status=status,
            account_email=account_email,
            scopes=scopes,
            token_payload=token_payload,
        )
        await search_console_store.set_connection_status(
            user_id,
            project_id,
            status=status,
            synced_at=int(datetime.now().timestamp()) if status == "valid" else None,
            last_sync_status=last_sync_status,
            last_sync_message=message,
        )
    except SearchConsoleServiceError as exc:
        _raise_service_error(exc)
    return SearchConsoleOAuthCallbackResponse(
        project_id=project_id,
        connected=True,
        status=status,
        property_url=property_url,
        message=message,
    )


@router.get("/status", response_model=SearchConsoleConnectionStatus)
async def get_status(
    projectId: str = Query(...),
    current_user: CurrentUser = Depends(require_current_user),
) -> SearchConsoleConnectionStatus:
    await require_owned_project_id(projectId, current_user)
    return await _build_status(current_user.user_id, projectId)


@router.get("/properties", response_model=SearchConsolePropertyListResponse)
async def list_properties(
    projectId: str = Query(...),
    current_user: CurrentUser = Depends(require_current_user),
) -> SearchConsolePropertyListResponse:
    await require_owned_project_id(projectId, current_user)
    domains = await _require_project_domains(current_user.user_id, projectId)
    access_token, _ = await _get_valid_access_token(current_user.user_id, projectId)
    try:
        sites = await search_console_service.list_properties(access_token)
    except SearchConsoleServiceError as exc:
        _raise_service_error(exc)
    properties = [
        prop
        for prop in (_property_from_site(site, domains) for site in sites)
        if prop is not None
    ]
    properties.sort(key=lambda item: (not item.matches_project_domain, item.site_url))
    return SearchConsolePropertyListResponse(project_id=projectId, items=properties)


@router.delete("/connection", response_model=SearchConsoleConnectionStatus)
@router.post("/disconnect", response_model=SearchConsoleConnectionStatus)
async def disconnect(
    projectId: str = Query(...),
    current_user: CurrentUser = Depends(require_current_user),
) -> SearchConsoleConnectionStatus:
    await require_owned_project_id(projectId, current_user)
    await search_console_store.clear_connection_tokens(current_user.user_id, projectId)
    return await _build_status(current_user.user_id, projectId)


@router.post("/property", response_model=SearchConsoleConnectionStatus)
async def set_property(
    payload: SearchConsolePropertyRequest,
    current_user: CurrentUser = Depends(require_current_user),
) -> SearchConsoleConnectionStatus:
    await require_owned_project_id(payload.project_id, current_user)
    domains = await _require_project_domains(current_user.user_id, payload.project_id)
    access_token, _ = await _get_valid_access_token(current_user.user_id, payload.project_id)
    property_url = _normalize_property(payload.property_url)
    try:
        sites = await search_console_service.list_properties(access_token)
    except SearchConsoleServiceError as exc:
        _raise_service_error(exc)
    accessible = {str(site.get("siteUrl")) for site in sites if site.get("siteUrl")}
    if property_url not in accessible:
        await search_console_store.set_connection_status(
            current_user.user_id,
            payload.project_id,
            status="invalid",
            last_sync_status="invalid",
            last_sync_message="Connected Google account cannot access this Search Console property.",
        )
        raise HTTPException(
            status_code=409,
            detail="Connected Google account cannot access this Search Console property.",
        )
    next_status = "connected"
    last_sync_status = "property_selected"
    last_sync_message = "Search Console property selected."
    if not _property_matches_domains(property_url, domains):
        next_status = "degraded"
        last_sync_status = "degraded"
        last_sync_message = "Property is accessible but does not match project domains."
    await search_console_store.upsert_connection(
        current_user.user_id,
        payload.project_id,
        property_url=property_url,
        status=next_status,
    )
    await search_console_store.set_connection_status(
        current_user.user_id,
        payload.project_id,
        status=next_status,
        last_sync_status=last_sync_status,
        last_sync_message=last_sync_message,
    )
    return await _build_status(current_user.user_id, payload.project_id)


@router.post("/validate", response_model=SearchConsoleConnectionStatus)
async def validate_connection(
    projectId: str = Query(...),
    current_user: CurrentUser = Depends(require_current_user),
) -> SearchConsoleConnectionStatus:
    await require_owned_project_id(projectId, current_user)
    domains = await _require_project_domains(current_user.user_id, projectId)
    connection = await search_console_store.get_connection(current_user.user_id, projectId)
    if not connection:
        raise HTTPException(status_code=409, detail="Search Console connection is missing.")
    property_url = connection.get("propertyUrl")
    if not property_url:
        raise HTTPException(status_code=409, detail="Select a Search Console property for this project.")
    access_token, _ = await _get_valid_access_token(current_user.user_id, projectId)
    try:
        sites = await search_console_service.list_properties(access_token)
    except SearchConsoleServiceError as exc:
        _raise_service_error(exc)
    property_urls = {str(site.get("siteUrl")) for site in sites if site.get("siteUrl")}
    if property_url not in property_urls:
        await search_console_store.set_connection_status(
            current_user.user_id,
            projectId,
            status="invalid",
            last_sync_status="invalid",
            last_sync_message="Connected account cannot access selected property.",
        )
        return await _build_status(current_user.user_id, projectId)
    if not _property_matches_domains(str(property_url), domains):
        await search_console_store.set_connection_status(
            current_user.user_id,
            projectId,
            status="degraded",
            last_sync_status="degraded",
            last_sync_message="Property is accessible but does not match project domains.",
        )
        return await _build_status(current_user.user_id, projectId)
    await search_console_store.set_connection_status(
        current_user.user_id,
        projectId,
        status="valid",
        synced_at=int(datetime.now().timestamp()),
        last_sync_status="valid",
        last_sync_message="Connection validated.",
    )
    return await _build_status(current_user.user_id, projectId)


@router.post("/sync", response_model=SearchConsoleSummaryResponse)
async def sync(
    projectId: str = Query(...),
    period: str = Query("30d"),
    current_user: CurrentUser = Depends(require_current_user),
) -> SearchConsoleSummaryResponse:
    await require_owned_project_id(projectId, current_user)
    connection = await search_console_store.get_connection(current_user.user_id, projectId)
    if not connection or not connection.get("propertyUrl"):
        raise HTTPException(status_code=409, detail="Search Console property is not configured.")
    property_url = str(connection["propertyUrl"])
    start, end = _period_window(period)
    access_token, _ = await _get_valid_access_token(current_user.user_id, projectId)
    try:
        top_pages_raw = await search_console_service.query_search_analytics(
            access_token=access_token,
            property_url=property_url,
            start_date=_to_date(start),
            end_date=_to_date(end),
            dimensions=["page"],
            row_limit=25,
        )
        top_queries_raw = await search_console_service.query_search_analytics(
            access_token=access_token,
            property_url=property_url,
            start_date=_to_date(start),
            end_date=_to_date(end),
            dimensions=["query"],
            row_limit=25,
        )
    except SearchConsoleServiceError as exc:
        await search_console_store.set_connection_status(
            current_user.user_id,
            projectId,
            status="degraded",
            last_sync_status="degraded",
            last_sync_message=exc.message,
        )
        raise HTTPException(status_code=409, detail=exc.message) from exc

    top_pages = _aggregate_rows(top_pages_raw, "url")
    top_queries = _aggregate_rows(top_queries_raw, "query")
    inspection_issues, inspected_pages, inspection_degraded_message = await _sample_url_inspections(
        access_token=access_token,
        property_url=property_url,
        pages=top_pages,
        limit=5,
    )
    clicks = sum(item.clicks for item in top_pages)
    impressions = sum(item.impressions for item in top_pages)
    ctr = round((clicks / impressions), 4) if impressions > 0 else 0.0
    avg_position_vals = [item.position for item in top_pages if item.position is not None]
    avg_position = round(sum(avg_position_vals) / len(avg_position_vals), 2) if avg_position_vals else None
    opportunities = _opportunities_from_rows(period=period, top_pages=top_pages, top_queries=top_queries)
    for issue in inspection_issues:
        issue_type = str(issue.get("type") or "indexation_problem")
        target_url = str(issue.get("url") or "")
        opportunities.append(
            SearchConsoleOpportunity(
                reason=issue_type,
                period=period,
                title=f"Review Search Console issue for {target_url}",
                confidence=0.75,
                priority_score=70.0 if issue_type == "indexation_problem" else 60.0,
                target_url=target_url,
                summary="URL Inspection found a Google indexation or canonical signal to review.",
                evidence=issue,
            )
        )
    opportunities = opportunities[:30]
    sync_status = "degraded" if inspection_degraded_message else "ok"
    sync_message = inspection_degraded_message or "Sync completed."
    google_payload = {
        "source": "search_console",
        "sourceLabel": "Google Search",
        "period": period,
        "summary": (
            f"Organic clicks: {clicks}, impressions: {impressions}, CTR: {round(ctr * 100, 2)}%. "
            f"URL Inspection sampled {inspected_pages} pages."
        ),
        "metrics": {
            "organic_clicks": clicks,
            "impressions": impressions,
            "ctr": ctr,
            "avg_position": avg_position,
            "inspected_pages": inspected_pages,
            "inspection_issue_count": len(inspection_issues),
        },
        "topPages": [item.model_dump(by_alias=True) for item in top_pages],
        "topQueries": [item.model_dump(by_alias=True) for item in top_queries],
        "issues": inspection_issues,
        "opportunities": [item.model_dump(by_alias=True) for item in opportunities],
    }
    await search_console_store.upsert_snapshot(
        current_user.user_id,
        projectId,
        property_url,
        period,
        is_partial=(period == "today"),
        google_payload=google_payload,
        analytics_payload=None,
        status=sync_status,
    )
    await search_console_store.set_connection_status(
        current_user.user_id,
        projectId,
        status="degraded" if inspection_degraded_message else "valid",
        synced_at=int(datetime.now().timestamp()),
        last_sync_status=sync_status,
        last_sync_message=sync_message,
    )
    return await get_summary(projectId=projectId, period=period, current_user=current_user)


@router.get("/summary", response_model=SearchConsoleSummaryResponse)
async def get_summary(
    projectId: str = Query(...),
    period: str = Query("30d"),
    current_user: CurrentUser = Depends(require_current_user),
) -> SearchConsoleSummaryResponse:
    await require_owned_project_id(projectId, current_user)
    connection = await search_console_store.get_connection(current_user.user_id, projectId)
    property_url = connection.get("propertyUrl") if connection else None
    snapshot = None
    if property_url:
        snapshot = await search_console_store.get_snapshot(current_user.user_id, projectId, str(property_url), period)
    google_payload = (snapshot or {}).get("googleSearchPayload") or {}
    top_pages = [SearchConsoleTopRow(**row) for row in google_payload.get("topPages", []) if isinstance(row, dict)]
    top_queries = [SearchConsoleTopRow(**row) for row in google_payload.get("topQueries", []) if isinstance(row, dict)]
    connection_status = str((connection or {}).get("status") or "").lower()
    snapshot_is_stale = snapshot is None or connection_status in {"disconnected", "invalid", "expired"}
    google_section = SearchConsoleSourceSection(
        source="search_console",
        source_label="Google Search",
        period=period,
        is_partial=bool((snapshot or {}).get("isPartial", False)),
        stale=snapshot_is_stale,
        synced_at=(snapshot or {}).get("syncedAt"),
        summary=str(google_payload.get("summary") or "Connect and sync Google Search Console to populate this section."),
        metrics=google_payload.get("metrics") if isinstance(google_payload.get("metrics"), dict) else {},
        top_pages=top_pages,
        top_queries=top_queries,
        issues=google_payload.get("issues") if isinstance(google_payload.get("issues"), list) else [],
    )
    site_traffic = SearchConsoleSiteTrafficSection(
        source="private_analytics",
        source_label="Site traffic (private tracker)",
        period=period,
        stale=True,
        metrics={},
        top_pages=[],
        message="No private analytics data available.",
    )
    try:
        domains = await _require_project_domains(current_user.user_id, projectId)
        start, end = _period_window(period)
        summary = await analytics_store.get_summary(domains, int(start.timestamp()), int(end.timestamp()))
        top_site_pages = await analytics_store.get_top_pages(domains, int(start.timestamp()), int(end.timestamp()), 10)
        site_traffic = SearchConsoleSiteTrafficSection(
            source="private_analytics",
            source_label="Site traffic (private tracker)",
            period=period,
            stale=False,
            metrics={
                "visits_pageviews": summary.get("totalViews", 0),
                "unique_pages": summary.get("uniquePages", 0),
            },
            top_pages=top_site_pages,
            message="Private tracker pageviews are contextual and separate from Google Search clicks.",
        )
    except Exception:
        pass
    opp_count = len(google_payload.get("opportunities", [])) if isinstance(google_payload.get("opportunities"), list) else 0
    overview = (
        "Google Search signals and private site traffic are shown separately. "
        "Use Search Console opportunities as editorial evidence."
    )
    return SearchConsoleSummaryResponse(
        project_id=projectId,
        period=period,
        period_name=period,
        google_search=google_section,
        site_traffic=site_traffic,
        overview=overview,
        opportunities_count=opp_count,
        errors=[],
    )


@router.get("/opportunities", response_model=SearchConsoleOpportunityResponse)
async def list_opportunities(
    projectId: str = Query(...),
    period: str = Query("30d"),
    current_user: CurrentUser = Depends(require_current_user),
) -> SearchConsoleOpportunityResponse:
    await require_owned_project_id(projectId, current_user)
    connection = await search_console_store.get_connection(current_user.user_id, projectId)
    if not connection or not connection.get("propertyUrl"):
        return SearchConsoleOpportunityResponse(project_id=projectId, period=period, items=[], source="search_console")
    snapshot = await search_console_store.get_snapshot(
        current_user.user_id, projectId, str(connection["propertyUrl"]), period
    )
    payload = (snapshot or {}).get("googleSearchPayload") or {}
    items = [
        SearchConsoleOpportunity(**row)
        for row in payload.get("opportunities", [])
        if isinstance(row, dict)
    ]
    return SearchConsoleOpportunityResponse(
        project_id=projectId,
        period=period,
        items=items,
        source="search_console",
    )


@router.post("/opportunities/ingest", response_model=SearchConsoleIngestResponse)
async def ingest_opportunities(
    payload: SearchConsoleIngestRequest,
    current_user: CurrentUser = Depends(require_current_user),
) -> SearchConsoleIngestResponse:
    await require_owned_project_id(payload.project_id, current_user)
    svc = get_status_service()
    existing, _ = svc.list_ideas(
        source="search_console_feedback",
        project_id=payload.project_id,
        user_id=current_user.user_id,
        limit=500,
        offset=0,
    )
    existing_keys: set[str] = set()
    def _dedupe(reason: Any, period: Any, target_url: Any, target_query: Any) -> str:
        return "|".join(
            [
                str(reason or "").strip().lower(),
                str(period or "").strip().lower(),
                str(target_url or "").strip().lower(),
                str(target_query or "").strip().lower(),
            ]
        )
    for item in existing:
        raw = item.get("raw_data") or {}
        existing_keys.add(_dedupe(raw.get("reason"), raw.get("period"), raw.get("target_url"), raw.get("target_query")))
    ingested = 0
    skipped = 0
    for item in payload.opportunities:
        dedupe_key = _dedupe(item.reason, item.period, item.target_url, item.target_query)
        if dedupe_key in existing_keys:
            skipped += 1
            continue
        svc.create_idea(
            source="search_console_feedback",
            title=item.title,
            raw_data={
                "reason": item.reason,
                "period": item.period,
                "target_url": item.target_url,
                "target_query": item.target_query,
                "evidence": item.evidence,
                "source": "search_console",
                "source_label": "Google Search Console",
            },
            seo_signals={
                "source": "search_console",
                "source_label": "Google Search Console",
            },
            tags=["search-console", item.reason],
            priority_score=item.priority_score,
            project_id=payload.project_id,
            user_id=current_user.user_id,
        )
        ingested += 1
    return SearchConsoleIngestResponse(project_id=payload.project_id, ingested=ingested, skipped=skipped)

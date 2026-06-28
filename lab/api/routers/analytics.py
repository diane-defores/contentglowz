"""Cookie-free pageview analytics — public collect + authenticated queries.

Two routers are exported:
  analytics_public_router  (/a)            — no auth, open CORS
  analytics_router         (/api/analytics) — Clerk JWT required
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response

from api.dependencies.auth import CurrentUser, require_current_user
from api.models.analytics import (
    AnalyticsSummary,
    CollectPayload,
    PageStats,
    ReferrerStats,
    TimeseriesPoint,
)
from api.services.analytics_store import analytics_store, _normalize_domain
from api.services.ua_parser import parse_ua
from api.services.user_data_store import user_data_store


# ─────────────────────────────────────────────────
# Tracking script (embedded, ~600 bytes)
# ─────────────────────────────────────────────────

_TRACKING_SCRIPT = """(function(){
var s=document.currentScript,b=s.src.replace("/a/s.js","/a/collect");
function u(p){return(new URLSearchParams(location.search)).get(p)||void 0}
function send(){
var d={d:location.hostname,p:location.pathname,r:document.referrer||void 0,
us:u("utm_source"),um:u("utm_medium"),uc:u("utm_campaign")};
var j=JSON.stringify(d);
if(navigator.sendBeacon){navigator.sendBeacon(b,new Blob([j],{type:"application/json"}))}
else{fetch(b,{method:"POST",body:j,headers:{"Content-Type":"application/json"},keepalive:true})}
}
var last=location.pathname;
function track(){if(location.pathname!==last){last=location.pathname;send()}}
var P=history.pushState;history.pushState=function(){P.apply(this,arguments);track()};
window.addEventListener("popstate",track);
send();
})();"""


# ─────────────────────────────────────────────────
# Public router — /a (no auth)
# ─────────────────────────────────────────────────

analytics_public_router = APIRouter(prefix="/a", tags=["Analytics (Public)"])


@analytics_public_router.get("/s.js")
async def serve_script():
    """Serve the lightweight tracking script."""
    return Response(
        content=_TRACKING_SCRIPT,
        media_type="application/javascript",
        headers={
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*",
        },
    )


@analytics_public_router.options("/collect")
async def collect_preflight():
    """CORS preflight for the collect endpoint."""
    return Response(
        status_code=204,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400",
        },
    )


@analytics_public_router.post("/collect", status_code=204)
async def collect_pageview(request: Request):
    """Record a pageview. Always returns 204 (silent failure policy)."""
    headers = {
        "Access-Control-Allow-Origin": "*",
    }
    try:
        body = await request.json()
        payload = CollectPayload(**body)

        # Validate domain is registered (silently drop if not)
        if not await analytics_store.domain_is_registered(payload.d):
            return Response(status_code=204, headers=headers)

        # Parse user-agent server-side
        ua_string = request.headers.get("user-agent", "")
        ua = parse_ua(ua_string)

        # Country from CDN/proxy headers (no GeoIP DB needed)
        country = (
            request.headers.get("cf-ipcountry")
            or request.headers.get("x-vercel-ip-country")
            or request.headers.get("x-country-code")
        )

        await analytics_store.record_pageview(
            domain=payload.d,
            path=payload.p,
            referrer=payload.r,
            utm_source=payload.us,
            utm_medium=payload.um,
            utm_campaign=payload.uc,
            country=country,
            device=ua["device"],
            browser=ua["browser"],
            os_name=ua["os"],
        )
    except Exception:
        pass  # Silent — never leak errors to the tracking script

    return Response(status_code=204, headers=headers)


# ─────────────────────────────────────────────────
# Authenticated router — /api/analytics
# ─────────────────────────────────────────────────

analytics_router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


def _period_to_range(period: str) -> tuple[int, int]:
    """Convert a period string (7d, 30d, 90d) to (start, end) unix timestamps."""
    days_map = {"7d": 7, "30d": 30, "90d": 90}
    days = days_map.get(period, 30)
    end = int(datetime.now().timestamp())
    start = int((datetime.now() - timedelta(days=days)).timestamp())
    return start, end


async def _resolve_project_domains(
    user: CurrentUser, project_id: str
) -> list[str]:
    """Get the list of domains for a user's project, normalized."""
    work_domains = await user_data_store.list_work_domains(
        user.user_id, project_id
    )
    if not work_domains:
        raise HTTPException(
            status_code=404,
            detail="No domains found for this project",
        )
    return [wd["domain"] for wd in work_domains]


@analytics_router.get("/summary", response_model=AnalyticsSummary)
async def get_summary(
    projectId: str = Query(..., description="Project ID"),
    period: str = Query("30d", regex=r"^(7|30|90)d$"),
    user: CurrentUser = Depends(require_current_user),
):
    domains = await _resolve_project_domains(user, projectId)
    start, end = _period_to_range(period)
    summary = await analytics_store.get_summary(domains, start, end)
    normalized = [_normalize_domain(d) for d in domains]
    return AnalyticsSummary(
        totalViews=summary["totalViews"],
        uniquePages=summary["uniquePages"],
        topPage=summary["topPage"],
        topReferrer=summary["topReferrer"],
        period=period,
        domains=normalized,
    )


@analytics_router.get("/pages", response_model=list[PageStats])
async def get_pages(
    projectId: str = Query(..., description="Project ID"),
    period: str = Query("30d", regex=r"^(7|30|90)d$"),
    limit: int = Query(20, ge=1, le=100),
    user: CurrentUser = Depends(require_current_user),
):
    domains = await _resolve_project_domains(user, projectId)
    start, end = _period_to_range(period)
    rows = await analytics_store.get_top_pages(domains, start, end, limit)
    return [PageStats(**row) for row in rows]


@analytics_router.get("/referrers", response_model=list[ReferrerStats])
async def get_referrers(
    projectId: str = Query(..., description="Project ID"),
    period: str = Query("30d", regex=r"^(7|30|90)d$"),
    limit: int = Query(20, ge=1, le=100),
    user: CurrentUser = Depends(require_current_user),
):
    domains = await _resolve_project_domains(user, projectId)
    start, end = _period_to_range(period)
    rows = await analytics_store.get_top_referrers(domains, start, end, limit)
    return [ReferrerStats(**row) for row in rows]


@analytics_router.get("/timeseries", response_model=list[TimeseriesPoint])
async def get_timeseries(
    projectId: str = Query(..., description="Project ID"),
    period: str = Query("30d", regex=r"^(7|30|90)d$"),
    user: CurrentUser = Depends(require_current_user),
):
    domains = await _resolve_project_domains(user, projectId)
    start, end = _period_to_range(period)
    rows = await analytics_store.get_timeseries(domains, start, end)
    return [TimeseriesPoint(**row) for row in rows]

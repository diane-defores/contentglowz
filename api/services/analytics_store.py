"""DB-backed store for cookie-free pageview analytics.

Separate from UserDataStore because the collect path is public (no auth).
Follows the same Turso / libsql patterns used elsewhere in the codebase.
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime
from typing import Any

import libsql_client


def _normalize_domain(raw: str) -> str:
    """Strip protocol and www. prefix so domains match the bare hostname
    sent by the tracking script (location.hostname)."""
    d = raw.strip()
    for prefix in ("https://", "http://"):
        if d.startswith(prefix):
            d = d[len(prefix):]
    d = d.rstrip("/")
    if d.startswith("www."):
        d = d[4:]
    return d.lower()


class AnalyticsStore:
    """Thin repository for PageView events."""

    def __init__(self) -> None:
        self.db_client = None
        if os.getenv("TURSO_DATABASE_URL") and os.getenv("TURSO_AUTH_TOKEN"):
            self.db_client = libsql_client.create_client(
                url=os.getenv("TURSO_DATABASE_URL"),
                auth_token=os.getenv("TURSO_AUTH_TOKEN"),
            )

    def _ensure_connected(self) -> None:
        if not self.db_client:
            raise RuntimeError(
                "Database not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN."
            )

    # ── Migrations ───────────────────────────────

    async def ensure_pageview_table(self) -> None:
        self._ensure_connected()
        await self.db_client.execute(
            """
            CREATE TABLE IF NOT EXISTS PageView (
                id TEXT PRIMARY KEY NOT NULL,
                domain TEXT NOT NULL,
                path TEXT NOT NULL,
                referrer TEXT,
                utm_source TEXT,
                utm_medium TEXT,
                utm_campaign TEXT,
                country TEXT,
                device TEXT,
                browser TEXT,
                os TEXT,
                createdAt INTEGER NOT NULL
            )
            """
        )
        await self.db_client.execute(
            "CREATE INDEX IF NOT EXISTS idx_pv_domain_created ON PageView (domain, createdAt)"
        )

    # ── Write ────────────────────────────────────

    async def record_pageview(
        self,
        *,
        domain: str,
        path: str,
        referrer: str | None = None,
        utm_source: str | None = None,
        utm_medium: str | None = None,
        utm_campaign: str | None = None,
        country: str | None = None,
        device: str | None = None,
        browser: str | None = None,
        os_name: str | None = None,
    ) -> None:
        self._ensure_connected()
        await self.db_client.execute(
            """
            INSERT INTO PageView (
                id, domain, path, referrer,
                utm_source, utm_medium, utm_campaign,
                country, device, browser, os, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                str(uuid.uuid4()),
                _normalize_domain(domain),
                path,
                referrer,
                utm_source,
                utm_medium,
                utm_campaign,
                country,
                device,
                browser,
                os_name,
                int(datetime.now().timestamp()),
            ],
        )

    # ── Domain validation ────────────────────────

    async def domain_is_registered(self, hostname: str) -> bool:
        """Check if *any* WorkDomain row matches this hostname."""
        self._ensure_connected()
        normalized = _normalize_domain(hostname)
        rs = await self.db_client.execute(
            """
            SELECT 1 FROM WorkDomain
            WHERE LOWER(REPLACE(REPLACE(REPLACE(domain, 'https://', ''), 'http://', ''), 'www.', ''))
                  = ?
            LIMIT 1
            """,
            [normalized],
        )
        return len(rs.rows) > 0

    # ── Read (query) ─────────────────────────────

    def _in_clause(self, domains: list[str]) -> tuple[str, list[str]]:
        """Build a parameterised IN clause from a list of domains."""
        normalized = [_normalize_domain(d) for d in domains]
        placeholders = ", ".join(["?"] * len(normalized))
        return placeholders, normalized

    async def get_summary(
        self, domains: list[str], start: int, end: int
    ) -> dict[str, Any]:
        self._ensure_connected()
        ph, params = self._in_clause(domains)
        base = f"FROM PageView WHERE domain IN ({ph}) AND createdAt >= ? AND createdAt <= ?"
        params_with_range = params + [start, end]

        total = await self.db_client.execute(
            f"SELECT COUNT(*) {base}", params_with_range
        )
        unique_pages = await self.db_client.execute(
            f"SELECT COUNT(DISTINCT path) {base}", params_with_range
        )
        top_page = await self.db_client.execute(
            f"SELECT path, COUNT(*) as cnt {base} GROUP BY path ORDER BY cnt DESC LIMIT 1",
            params_with_range,
        )
        top_ref = await self.db_client.execute(
            f"SELECT referrer, COUNT(*) as cnt {base} AND referrer IS NOT NULL AND referrer != '' GROUP BY referrer ORDER BY cnt DESC LIMIT 1",
            params_with_range,
        )

        return {
            "totalViews": total.rows[0][0] if total.rows else 0,
            "uniquePages": unique_pages.rows[0][0] if unique_pages.rows else 0,
            "topPage": top_page.rows[0][0] if top_page.rows else None,
            "topReferrer": top_ref.rows[0][0] if top_ref.rows else None,
        }

    async def get_top_pages(
        self, domains: list[str], start: int, end: int, limit: int = 20
    ) -> list[dict[str, Any]]:
        self._ensure_connected()
        ph, params = self._in_clause(domains)
        rs = await self.db_client.execute(
            f"""
            SELECT path, COUNT(*) as views
            FROM PageView
            WHERE domain IN ({ph}) AND createdAt >= ? AND createdAt <= ?
            GROUP BY path
            ORDER BY views DESC
            LIMIT ?
            """,
            params + [start, end, limit],
        )
        return [{"path": row[0], "views": row[1]} for row in rs.rows]

    async def get_top_referrers(
        self, domains: list[str], start: int, end: int, limit: int = 20
    ) -> list[dict[str, Any]]:
        self._ensure_connected()
        ph, params = self._in_clause(domains)
        rs = await self.db_client.execute(
            f"""
            SELECT referrer, COUNT(*) as views
            FROM PageView
            WHERE domain IN ({ph}) AND createdAt >= ? AND createdAt <= ?
              AND referrer IS NOT NULL AND referrer != ''
            GROUP BY referrer
            ORDER BY views DESC
            LIMIT ?
            """,
            params + [start, end, limit],
        )
        return [{"referrer": row[0], "views": row[1]} for row in rs.rows]

    async def get_timeseries(
        self, domains: list[str], start: int, end: int
    ) -> list[dict[str, Any]]:
        self._ensure_connected()
        ph, params = self._in_clause(domains)
        rs = await self.db_client.execute(
            f"""
            SELECT (createdAt / 86400) * 86400 as day_ts, COUNT(*) as views
            FROM PageView
            WHERE domain IN ({ph}) AND createdAt >= ? AND createdAt <= ?
            GROUP BY day_ts
            ORDER BY day_ts ASC
            """,
            params + [start, end],
        )
        return [
            {
                "date": datetime.fromtimestamp(row[0]).strftime("%Y-%m-%d"),
                "views": row[1],
            }
            for row in rs.rows
        ]


# Module-level singleton (matches UserDataStore pattern)
analytics_store = AnalyticsStore()

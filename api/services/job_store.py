"""DB-backed job store for background tasks (deployment, content generation).

Persists job state in Turso/libsql so jobs survive API restarts.
"""

from __future__ import annotations

import json
import os
from datetime import datetime
from typing import Any

from utils.libsql_async import create_client


class JobStore:
    """Persists async job state in Turso."""

    def __init__(self) -> None:
        self.db_client = None
        if os.getenv("TURSO_DATABASE_URL") and os.getenv("TURSO_AUTH_TOKEN"):
            self.db_client = create_client(
                url=os.getenv("TURSO_DATABASE_URL"),
                auth_token=os.getenv("TURSO_AUTH_TOKEN"),
            )
    async def ensure_table(self) -> None:
        """Create jobs table if it doesn't exist (idempotent)."""
        self._ensure_connected()
        await self.db_client.execute(
            """
            CREATE TABLE IF NOT EXISTS jobs (
                job_id    TEXT PRIMARY KEY,
                job_type  TEXT NOT NULL,
                status    TEXT NOT NULL DEFAULT 'pending',
                progress  INTEGER NOT NULL DEFAULT 0,
                message   TEXT,
                data      TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )

    async def upsert(self, job_id: str, job_type: str, **fields: Any) -> dict[str, Any]:
        """Create or update a job. Extra fields are stored in the `data` JSON column."""
        self._ensure_connected()
        now = datetime.utcnow().isoformat()
        status = fields.pop("status", "pending")
        progress = fields.pop("progress", 0)
        message = fields.pop("message", None)

        data_json = json.dumps(fields) if fields else None
        await self.db_client.execute(
            """
            INSERT INTO jobs (job_id, job_type, status, progress, message, data, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(job_id) DO UPDATE SET
                status = excluded.status,
                progress = excluded.progress,
                message = excluded.message,
                data = excluded.data,
                updated_at = excluded.updated_at
            """,
            [job_id, job_type, status, progress, message, data_json, now, now],
        )

        return await self.get(job_id) or {}

    async def update(self, job_id: str, **fields: Any) -> None:
        """Partial update of a job's mutable fields."""
        self._ensure_connected()
        now = datetime.utcnow().isoformat()

        current = await self.get(job_id)
        if not current:
            return
        status = fields.pop("status", current.get("status", "pending"))
        progress = fields.pop("progress", current.get("progress", 0))
        message = fields.pop("message", current.get("message"))
        existing_data = {
            k: v for k, v in current.items()
            if k not in ("job_id", "job_type", "status", "progress", "message", "created_at", "updated_at")
        }
        existing_data.update(fields)
        data_json = json.dumps(existing_data) if existing_data else None
        await self.db_client.execute(
            """
            UPDATE jobs SET status = ?, progress = ?, message = ?, data = ?, updated_at = ?
            WHERE job_id = ?
            """,
            [status, progress, message, data_json, now, job_id],
        )

    async def get(self, job_id: str) -> dict[str, Any] | None:
        """Retrieve a single job by ID."""
        self._ensure_connected()
        rs = await self.db_client.execute(
            "SELECT job_id, job_type, status, progress, message, data, created_at, updated_at FROM jobs WHERE job_id = ?",
            [job_id],
        )
        if not rs.rows:
            return None
        return self._row_to_dict(rs.rows[0])

    async def list_by_type(self, job_type: str, limit: int = 50) -> list[dict[str, Any]]:
        """List jobs of a given type, most recent first."""
        self._ensure_connected()
        rs = await self.db_client.execute(
            "SELECT job_id, job_type, status, progress, message, data, created_at, updated_at FROM jobs WHERE job_type = ? ORDER BY created_at DESC LIMIT ?",
            [job_type, limit],
        )
        return [self._row_to_dict(row) for row in rs.rows]

    async def delete(self, job_id: str) -> None:
        """Delete a job."""
        self._ensure_connected()
        await self.db_client.execute("DELETE FROM jobs WHERE job_id = ?", [job_id])

    def _ensure_connected(self) -> None:
        if not self.db_client:
            raise RuntimeError(
                "Job store not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN."
            )

    @staticmethod
    def _row_to_dict(row: tuple) -> dict[str, Any]:
        base = {
            "job_id": row[0],
            "job_type": row[1],
            "status": row[2],
            "progress": row[3],
            "message": row[4],
            "created_at": row[6],
            "updated_at": row[7],
        }
        if row[5]:
            try:
                extra = json.loads(row[5])
                base.update(extra)
            except (json.JSONDecodeError, TypeError):
                pass
        return base


# Singleton
job_store = JobStore()

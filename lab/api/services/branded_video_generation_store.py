"""Persistent store for ahead-of-time branded video generation runs."""

from __future__ import annotations

import os
import uuid
from datetime import datetime
from typing import Any

from utils.libsql_async import create_client


BRANDED_VIDEO_GENERATION_RUNS_SQL = """
CREATE TABLE IF NOT EXISTS branded_video_generation_runs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    content_id TEXT NOT NULL,
    format_preset TEXT NOT NULL,
    status TEXT NOT NULL,
    readiness TEXT NOT NULL,
    blocker_code TEXT,
    blocker_summary TEXT,
    blockers_json TEXT NOT NULL DEFAULT '[]',
    timeline_id TEXT,
    version_id TEXT,
    preview_job_id TEXT,
    final_job_id TEXT,
    brand_profile_id TEXT,
    blueprint_id TEXT,
    trigger_source TEXT,
    last_error TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
)
"""


class BrandedVideoGenerationRunStore:
    """Async libSQL store for durable branded video generation runs."""

    def __init__(self, db_client: Any | None = None) -> None:
        self.db_client = db_client
        if self.db_client is None and os.getenv("TURSO_DATABASE_URL") and os.getenv("TURSO_AUTH_TOKEN"):
            self.db_client = create_client(
                url=os.getenv("TURSO_DATABASE_URL"),
                auth_token=os.getenv("TURSO_AUTH_TOKEN"),
            )

    async def ensure_table(self) -> None:
        self._ensure_connected()
        await self.db_client.execute(BRANDED_VIDEO_GENERATION_RUNS_SQL)
        await self.db_client.execute(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS idx_branded_video_generation_runs_content
            ON branded_video_generation_runs(user_id, project_id, content_id, format_preset)
            """
        )
        await self.db_client.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_branded_video_generation_runs_project
            ON branded_video_generation_runs(project_id, user_id, updated_at)
            """
        )

    async def create_or_get_run(
        self,
        *,
        user_id: str,
        project_id: str,
        content_id: str,
        format_preset: str,
        trigger_source: str | None = None,
        brand_profile_id: str | None = None,
        blueprint_id: str | None = None,
    ) -> tuple[dict[str, Any], bool]:
        self._ensure_connected()
        existing = await self.get_by_content(
            user_id=user_id,
            project_id=project_id,
            content_id=content_id,
            format_preset=format_preset,
        )
        if existing:
            return existing, False

        now = datetime.utcnow().isoformat()
        run_id = str(uuid.uuid4())
        await self.db_client.execute(
            """
            INSERT INTO branded_video_generation_runs (
                id, user_id, project_id, content_id, format_preset, status, readiness,
                blocker_code, blocker_summary, blockers_json, timeline_id, version_id,
                preview_job_id, final_job_id, brand_profile_id, blueprint_id,
                trigger_source, last_error, completed_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, 'queued', 'preparing', NULL, NULL, '[]', NULL, NULL,
                      NULL, NULL, ?, ?, ?, NULL, NULL, ?, ?)
            """,
            [
                run_id,
                user_id,
                project_id,
                content_id,
                format_preset,
                brand_profile_id,
                blueprint_id,
                trigger_source,
                now,
                now,
            ],
        )
        run = await self.get(run_id=run_id, user_id=user_id)
        return run, True

    async def get(self, *, run_id: str, user_id: str) -> dict[str, Any]:
        self._ensure_connected()
        rs = await self.db_client.execute(
            """
            SELECT id, user_id, project_id, content_id, format_preset, status, readiness,
                   blocker_code, blocker_summary, blockers_json, timeline_id, version_id,
                   preview_job_id, final_job_id, brand_profile_id, blueprint_id,
                   trigger_source, last_error, completed_at, created_at, updated_at
            FROM branded_video_generation_runs
            WHERE id = ? AND user_id = ?
            LIMIT 1
            """,
            [run_id, user_id],
        )
        if not rs.rows:
            raise RuntimeError("Generation run not found")
        return self._row_to_dict(rs.rows[0])

    async def get_by_content(
        self,
        *,
        user_id: str,
        project_id: str,
        content_id: str,
        format_preset: str,
    ) -> dict[str, Any] | None:
        self._ensure_connected()
        rs = await self.db_client.execute(
            """
            SELECT id, user_id, project_id, content_id, format_preset, status, readiness,
                   blocker_code, blocker_summary, blockers_json, timeline_id, version_id,
                   preview_job_id, final_job_id, brand_profile_id, blueprint_id,
                   trigger_source, last_error, completed_at, created_at, updated_at
            FROM branded_video_generation_runs
            WHERE user_id = ? AND project_id = ? AND content_id = ? AND format_preset = ?
            LIMIT 1
            """,
            [user_id, project_id, content_id, format_preset],
        )
        if not rs.rows:
            return None
        return self._row_to_dict(rs.rows[0])

    async def list_by_project(
        self,
        *,
        user_id: str,
        project_id: str,
        content_ids: list[str] | None = None,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        self._ensure_connected()
        query = """
            SELECT id, user_id, project_id, content_id, format_preset, status, readiness,
                   blocker_code, blocker_summary, blockers_json, timeline_id, version_id,
                   preview_job_id, final_job_id, brand_profile_id, blueprint_id,
                   trigger_source, last_error, completed_at, created_at, updated_at
            FROM branded_video_generation_runs
            WHERE user_id = ? AND project_id = ?
        """
        params: list[Any] = [user_id, project_id]
        if content_ids:
            placeholders = ", ".join("?" for _ in content_ids)
            query += f" AND content_id IN ({placeholders})"
            params.extend(content_ids)
        query += " ORDER BY updated_at DESC LIMIT ?"
        params.append(limit)
        rs = await self.db_client.execute(query, params)
        return [self._row_to_dict(row) for row in rs.rows]

    async def update_run(
        self,
        *,
        run_id: str,
        user_id: str,
        **fields: Any,
    ) -> dict[str, Any]:
        self._ensure_connected()
        current = await self.get(run_id=run_id, user_id=user_id)
        allowed_fields = {
            "status",
            "readiness",
            "blocker_code",
            "blocker_summary",
            "blockers_json",
            "timeline_id",
            "version_id",
            "preview_job_id",
            "final_job_id",
            "brand_profile_id",
            "blueprint_id",
            "trigger_source",
            "last_error",
            "completed_at",
        }
        updates = {key: value for key, value in fields.items() if key in allowed_fields}
        if not updates:
            return current
        updates["updated_at"] = datetime.utcnow().isoformat()
        set_clause = ", ".join(f"{field} = ?" for field in updates)
        params = list(updates.values()) + [run_id, user_id]
        await self.db_client.execute(
            f"UPDATE branded_video_generation_runs SET {set_clause} WHERE id = ? AND user_id = ?",
            params,
        )
        return await self.get(run_id=run_id, user_id=user_id)

    def _ensure_connected(self) -> None:
        if not self.db_client:
            raise RuntimeError(
                "Branded video generation store not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN."
            )

    @staticmethod
    def _row_to_dict(row: tuple[Any, ...]) -> dict[str, Any]:
        import json

        blockers: list[str] = []
        raw_blockers = row[9]
        if raw_blockers:
            try:
                blockers = [str(value) for value in json.loads(raw_blockers)]
            except (TypeError, ValueError):
                blockers = []
        return {
            "id": row[0],
            "user_id": row[1],
            "project_id": row[2],
            "content_id": row[3],
            "format_preset": row[4],
            "status": row[5],
            "readiness": row[6],
            "blocker_code": row[7],
            "blocker_summary": row[8],
            "blockers": blockers,
            "timeline_id": row[10],
            "version_id": row[11],
            "preview_job_id": row[12],
            "final_job_id": row[13],
            "brand_profile_id": row[14],
            "blueprint_id": row[15],
            "trigger_source": row[16],
            "last_error": row[17],
            "completed_at": row[18],
            "created_at": row[19],
            "updated_at": row[20],
        }


branded_video_generation_store = BrandedVideoGenerationRunStore()

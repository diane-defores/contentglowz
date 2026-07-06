"""Persistent store for project-scoped brand video blueprints."""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any

from utils.libsql_async import create_client


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _json_dump(value: Any) -> str:
    return json.dumps(value, separators=(",", ":"), ensure_ascii=True)


def _json_load(value: Any) -> dict[str, Any]:
    if value is None:
        return {}
    if isinstance(value, dict):
        return value
    if isinstance(value, (bytes, bytearray)):
        value = value.decode("utf-8", errors="ignore")
    try:
        loaded = json.loads(value)
    except Exception:
        return {}
    return loaded if isinstance(loaded, dict) else {}


def _ts(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            pass
    return datetime.now(timezone.utc)


class BrandVideoBlueprintStore:
    """Async libSQL store for project brand video blueprint rules."""

    def __init__(self, db_client: Any | None = None) -> None:
        self.db_client = db_client
        if self.db_client is None and os.getenv("TURSO_DATABASE_URL") and os.getenv("TURSO_AUTH_TOKEN"):
            self.db_client = create_client(
                url=os.getenv("TURSO_DATABASE_URL"),
                auth_token=os.getenv("TURSO_AUTH_TOKEN"),
            )

    def _ensure_connected(self) -> None:
        if not self.db_client:
            raise RuntimeError("Database not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.")

    async def ensure_tables(self) -> None:
        self._ensure_connected()
        await self.db_client.execute(
            """
            CREATE TABLE IF NOT EXISTS brand_video_blueprints (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                project_id TEXT NOT NULL,
                brand_profile_id TEXT NOT NULL,
                name TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'draft',
                default_archetype TEXT NOT NULL,
                scene_rules_json TEXT NOT NULL DEFAULT '{}',
                layout_rules_json TEXT NOT NULL DEFAULT '{}',
                motion_rules_json TEXT NOT NULL DEFAULT '{}',
                caption_rules_json TEXT NOT NULL DEFAULT '{}',
                cta_rules_json TEXT NOT NULL DEFAULT '{}',
                audio_rules_json TEXT NOT NULL DEFAULT '{}',
                export_rules_json TEXT NOT NULL DEFAULT '{}',
                allowed_regeneration_locks_json TEXT NOT NULL DEFAULT '{}',
                revision INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        await self.db_client.execute(
            "CREATE INDEX IF NOT EXISTS idx_brand_video_blueprints_project_owner ON brand_video_blueprints(project_id, user_id, updated_at)"
        )
        await self.db_client.execute(
            "CREATE INDEX IF NOT EXISTS idx_brand_video_blueprints_profile_owner ON brand_video_blueprints(brand_profile_id, user_id, updated_at)"
        )

    def _row_to_dict(self, row: tuple[Any, ...]) -> dict[str, Any]:
        return {
            "id": row[0],
            "user_id": row[1],
            "project_id": row[2],
            "brand_profile_id": row[3],
            "name": row[4],
            "status": row[5],
            "default_archetype": row[6],
            "scene_rules_json": _json_load(row[7]),
            "layout_rules_json": _json_load(row[8]),
            "motion_rules_json": _json_load(row[9]),
            "caption_rules_json": _json_load(row[10]),
            "cta_rules_json": _json_load(row[11]),
            "audio_rules_json": _json_load(row[12]),
            "export_rules_json": _json_load(row[13]),
            "allowed_regeneration_locks_json": _json_load(row[14]),
            "revision": int(row[15] or 1),
            "created_at": _ts(row[16]),
            "updated_at": _ts(row[17]),
        }

    async def list_brand_video_blueprints(
        self,
        *,
        user_id: str,
        project_id: str,
        brand_profile_id: str | None = None,
    ) -> list[dict[str, Any]]:
        self._ensure_connected()
        sql = """
            SELECT id, user_id, project_id, brand_profile_id, name, status, default_archetype,
                   scene_rules_json, layout_rules_json, motion_rules_json, caption_rules_json,
                   cta_rules_json, audio_rules_json, export_rules_json, allowed_regeneration_locks_json,
                   revision, created_at, updated_at
            FROM brand_video_blueprints
            WHERE user_id = ? AND project_id = ?
        """
        params: list[Any] = [user_id, project_id]
        if brand_profile_id:
            sql += " AND brand_profile_id = ?"
            params.append(brand_profile_id)
        sql += " ORDER BY updated_at DESC, created_at DESC"
        rs = await self.db_client.execute(sql, params)
        return [self._row_to_dict(row) for row in rs.rows]

    async def get_brand_video_blueprint(self, *, blueprint_id: str, user_id: str) -> dict[str, Any] | None:
        self._ensure_connected()
        rs = await self.db_client.execute(
            """
            SELECT id, user_id, project_id, brand_profile_id, name, status, default_archetype,
                   scene_rules_json, layout_rules_json, motion_rules_json, caption_rules_json,
                   cta_rules_json, audio_rules_json, export_rules_json, allowed_regeneration_locks_json,
                   revision, created_at, updated_at
            FROM brand_video_blueprints
            WHERE id = ? AND user_id = ?
            LIMIT 1
            """,
            [blueprint_id, user_id],
        )
        if not rs.rows:
            return None
        return self._row_to_dict(rs.rows[0])

    async def create_brand_video_blueprint(self, *, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        self._ensure_connected()
        blueprint_id = str(uuid.uuid4())
        now = _now_iso()
        await self.db_client.execute(
            """
            INSERT INTO brand_video_blueprints (
                id, user_id, project_id, brand_profile_id, name, status, default_archetype,
                scene_rules_json, layout_rules_json, motion_rules_json, caption_rules_json,
                cta_rules_json, audio_rules_json, export_rules_json, allowed_regeneration_locks_json,
                revision, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
            """,
            [
                blueprint_id,
                user_id,
                payload["project_id"],
                payload["brand_profile_id"],
                payload["name"],
                payload.get("status", "draft"),
                payload.get("default_archetype", "ugc_ad"),
                _json_dump(payload.get("scene_rules_json") or {}),
                _json_dump(payload.get("layout_rules_json") or {}),
                _json_dump(payload.get("motion_rules_json") or {}),
                _json_dump(payload.get("caption_rules_json") or {}),
                _json_dump(payload.get("cta_rules_json") or {}),
                _json_dump(payload.get("audio_rules_json") or {}),
                _json_dump(payload.get("export_rules_json") or {}),
                _json_dump(payload.get("allowed_regeneration_locks_json") or {}),
                now,
                now,
            ],
        )
        created = await self.get_brand_video_blueprint(blueprint_id=blueprint_id, user_id=user_id)
        if created is None:
            raise RuntimeError("Failed to create brand video blueprint")
        return created

    async def update_brand_video_blueprint(self, *, blueprint_id: str, user_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        self._ensure_connected()
        existing = await self.get_brand_video_blueprint(blueprint_id=blueprint_id, user_id=user_id)
        if existing is None:
            return None
        merged = {
            "brand_profile_id": payload.get("brand_profile_id", existing["brand_profile_id"]),
            "name": payload.get("name", existing["name"]),
            "status": payload.get("status", existing["status"]),
            "default_archetype": payload.get("default_archetype", existing["default_archetype"]),
            "scene_rules_json": payload.get("scene_rules_json", existing["scene_rules_json"]),
            "layout_rules_json": payload.get("layout_rules_json", existing["layout_rules_json"]),
            "motion_rules_json": payload.get("motion_rules_json", existing["motion_rules_json"]),
            "caption_rules_json": payload.get("caption_rules_json", existing["caption_rules_json"]),
            "cta_rules_json": payload.get("cta_rules_json", existing["cta_rules_json"]),
            "audio_rules_json": payload.get("audio_rules_json", existing["audio_rules_json"]),
            "export_rules_json": payload.get("export_rules_json", existing["export_rules_json"]),
            "allowed_regeneration_locks_json": payload.get(
                "allowed_regeneration_locks_json",
                existing["allowed_regeneration_locks_json"],
            ),
        }
        await self.db_client.execute(
            """
            UPDATE brand_video_blueprints
            SET brand_profile_id = ?,
                name = ?,
                status = ?,
                default_archetype = ?,
                scene_rules_json = ?,
                layout_rules_json = ?,
                motion_rules_json = ?,
                caption_rules_json = ?,
                cta_rules_json = ?,
                audio_rules_json = ?,
                export_rules_json = ?,
                allowed_regeneration_locks_json = ?,
                revision = revision + 1,
                updated_at = ?
            WHERE id = ? AND user_id = ?
            """,
            [
                merged["brand_profile_id"],
                merged["name"],
                merged["status"],
                merged["default_archetype"],
                _json_dump(merged["scene_rules_json"]),
                _json_dump(merged["layout_rules_json"]),
                _json_dump(merged["motion_rules_json"]),
                _json_dump(merged["caption_rules_json"]),
                _json_dump(merged["cta_rules_json"]),
                _json_dump(merged["audio_rules_json"]),
                _json_dump(merged["export_rules_json"]),
                _json_dump(merged["allowed_regeneration_locks_json"]),
                _now_iso(),
                blueprint_id,
                user_id,
            ],
        )
        return await self.get_brand_video_blueprint(blueprint_id=blueprint_id, user_id=user_id)

    async def delete_brand_video_blueprint(self, *, blueprint_id: str, user_id: str) -> bool:
        self._ensure_connected()
        existing = await self.get_brand_video_blueprint(blueprint_id=blueprint_id, user_id=user_id)
        if existing is None:
            return False
        await self.db_client.execute(
            "DELETE FROM brand_video_blueprints WHERE id = ? AND user_id = ?",
            [blueprint_id, user_id],
        )
        remaining = await self.get_brand_video_blueprint(blueprint_id=blueprint_id, user_id=user_id)
        return remaining is None


brand_video_blueprint_store = BrandVideoBlueprintStore()

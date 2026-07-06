"""Persistent store for project-scoped brand profiles."""

from __future__ import annotations

import json
import os
import uuid
from datetime import UTC, datetime
from typing import Any

from utils.libsql_async import create_client


def _json_load(raw: Any, fallback: Any) -> Any:
    if raw is None:
        return fallback
    if isinstance(raw, (dict, list)):
        return raw
    try:
        return json.loads(raw)
    except Exception:
        return fallback


def _json_dump(raw: Any) -> str | None:
    if raw is None:
        return None
    return json.dumps(raw, separators=(",", ":"), sort_keys=True)


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


CREATE_BRAND_PROFILE_SQL = """
CREATE TABLE IF NOT EXISTS brand_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    logo_asset_id TEXT,
    primary_colors_json TEXT NOT NULL DEFAULT '[]',
    secondary_colors_json TEXT NOT NULL DEFAULT '[]',
    font_heading TEXT,
    font_body TEXT,
    tone_keywords_json TEXT NOT NULL DEFAULT '[]',
    cta_defaults_json TEXT,
    caption_style_defaults_json TEXT,
    motion_intensity TEXT NOT NULL DEFAULT 'medium',
    transition_family TEXT,
    intro_module_enabled INTEGER NOT NULL DEFAULT 1,
    outro_module_enabled INTEGER NOT NULL DEFAULT 1,
    is_default INTEGER NOT NULL DEFAULT 0,
    revision INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
)
"""


class BrandProfileStore:
    def __init__(self, db_client: Any | None = None) -> None:
        self.db_client = db_client
        if self.db_client is None and os.getenv("TURSO_DATABASE_URL") and os.getenv("TURSO_AUTH_TOKEN"):
            self.db_client = create_client(
                url=os.getenv("TURSO_DATABASE_URL"),
                auth_token=os.getenv("TURSO_AUTH_TOKEN"),
            )

    def _ensure_connected(self) -> None:
        if not self.db_client:
            raise RuntimeError(
                "Database not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN."
            )

    async def ensure_tables(self) -> None:
        self._ensure_connected()
        await self.db_client.execute(CREATE_BRAND_PROFILE_SQL)
        await self.db_client.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_brand_profiles_project_owner
            ON brand_profiles(project_id, user_id, updated_at)
            """
        )
        await self.db_client.execute(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_profiles_project_default
            ON brand_profiles(project_id, user_id)
            WHERE is_default = 1
            """
        )

    def _from_row(self, row: tuple[Any, ...]) -> dict[str, Any]:
        return {
            "id": row[0],
            "user_id": row[1],
            "project_id": row[2],
            "name": row[3],
            "logo_asset_id": row[4],
            "primary_colors": _json_load(row[5], []),
            "secondary_colors": _json_load(row[6], []),
            "font_heading": row[7],
            "font_body": row[8],
            "tone_keywords": _json_load(row[9], []),
            "cta_defaults": _json_load(row[10], None),
            "caption_style_defaults": _json_load(row[11], None),
            "motion_intensity": row[12] or "medium",
            "transition_family": row[13],
            "intro_module_enabled": bool(row[14]),
            "outro_module_enabled": bool(row[15]),
            "is_default": bool(row[16]),
            "revision": int(row[17] or 1),
            "created_at": row[18],
            "updated_at": row[19],
        }

    async def list_brand_profiles(self, *, user_id: str, project_id: str) -> list[dict[str, Any]]:
        self._ensure_connected()
        rs = await self.db_client.execute(
            """
            SELECT id, user_id, project_id, name, logo_asset_id,
                   primary_colors_json, secondary_colors_json,
                   font_heading, font_body, tone_keywords_json,
                   cta_defaults_json, caption_style_defaults_json,
                   motion_intensity, transition_family,
                   intro_module_enabled, outro_module_enabled,
                   is_default, revision, created_at, updated_at
            FROM brand_profiles
            WHERE user_id = ? AND project_id = ?
            ORDER BY is_default DESC, updated_at DESC
            """,
            [user_id, project_id],
        )
        return [self._from_row(row) for row in rs.rows]

    async def get_brand_profile(
        self,
        *,
        brand_profile_id: str,
        user_id: str,
    ) -> dict[str, Any] | None:
        self._ensure_connected()
        rs = await self.db_client.execute(
            """
            SELECT id, user_id, project_id, name, logo_asset_id,
                   primary_colors_json, secondary_colors_json,
                   font_heading, font_body, tone_keywords_json,
                   cta_defaults_json, caption_style_defaults_json,
                   motion_intensity, transition_family,
                   intro_module_enabled, outro_module_enabled,
                   is_default, revision, created_at, updated_at
            FROM brand_profiles
            WHERE id = ? AND user_id = ?
            LIMIT 1
            """,
            [brand_profile_id, user_id],
        )
        if not rs.rows:
            return None
        return self._from_row(rs.rows[0])

    async def create_brand_profile(self, *, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        self._ensure_connected()
        now = _now_iso()
        brand_profile_id = str(uuid.uuid4())
        is_default = bool(payload.get("is_default", False))
        project_id = str(payload["project_id"])
        if is_default:
            await self._clear_project_default(user_id=user_id, project_id=project_id)
        await self.db_client.execute(
            """
            INSERT INTO brand_profiles (
                id, user_id, project_id, name, logo_asset_id,
                primary_colors_json, secondary_colors_json,
                font_heading, font_body, tone_keywords_json,
                cta_defaults_json, caption_style_defaults_json,
                motion_intensity, transition_family,
                intro_module_enabled, outro_module_enabled,
                is_default, revision, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
            """,
            [
                brand_profile_id,
                user_id,
                project_id,
                str(payload["name"]).strip(),
                payload.get("logo_asset_id"),
                _json_dump(payload.get("primary_colors", [])),
                _json_dump(payload.get("secondary_colors", [])),
                payload.get("font_heading"),
                payload.get("font_body"),
                _json_dump(payload.get("tone_keywords", [])),
                _json_dump(payload.get("cta_defaults")),
                _json_dump(payload.get("caption_style_defaults")),
                payload.get("motion_intensity", "medium"),
                payload.get("transition_family"),
                1 if payload.get("intro_module_enabled", True) else 0,
                1 if payload.get("outro_module_enabled", True) else 0,
                1 if is_default else 0,
                now,
                now,
            ],
        )
        created = await self.get_brand_profile(brand_profile_id=brand_profile_id, user_id=user_id)
        if not created:
            raise RuntimeError("Failed to create brand profile")
        return created

    async def update_brand_profile(
        self,
        *,
        brand_profile_id: str,
        user_id: str,
        payload: dict[str, Any],
    ) -> dict[str, Any] | None:
        self._ensure_connected()
        current = await self.get_brand_profile(brand_profile_id=brand_profile_id, user_id=user_id)
        if not current:
            return None

        update_fields: list[str] = ["updated_at = ?", "revision = revision + 1"]
        params: list[Any] = [_now_iso()]

        scalar_mapping = {
            "name": "name",
            "logo_asset_id": "logo_asset_id",
            "font_heading": "font_heading",
            "font_body": "font_body",
            "motion_intensity": "motion_intensity",
            "transition_family": "transition_family",
        }
        for key, column in scalar_mapping.items():
            if key in payload:
                update_fields.append(f"{column} = ?")
                value = payload[key]
                if key == "name" and value is not None:
                    value = str(value).strip()
                params.append(value)

        json_mapping = {
            "primary_colors": "primary_colors_json",
            "secondary_colors": "secondary_colors_json",
            "tone_keywords": "tone_keywords_json",
            "cta_defaults": "cta_defaults_json",
            "caption_style_defaults": "caption_style_defaults_json",
        }
        for key, column in json_mapping.items():
            if key in payload:
                update_fields.append(f"{column} = ?")
                params.append(_json_dump(payload[key]))

        bool_mapping = {
            "intro_module_enabled": "intro_module_enabled",
            "outro_module_enabled": "outro_module_enabled",
            "is_default": "is_default",
        }
        for key, column in bool_mapping.items():
            if key in payload:
                update_fields.append(f"{column} = ?")
                params.append(1 if payload[key] else 0)

        if payload.get("is_default") is True:
            await self._clear_project_default(user_id=user_id, project_id=current["project_id"])

        params.extend([brand_profile_id, user_id])
        await self.db_client.execute(
            f"""
            UPDATE brand_profiles
            SET {", ".join(update_fields)}
            WHERE id = ? AND user_id = ?
            """,
            params,
        )
        return await self.get_brand_profile(brand_profile_id=brand_profile_id, user_id=user_id)

    async def delete_brand_profile(self, *, brand_profile_id: str, user_id: str) -> bool:
        self._ensure_connected()
        existing = await self.get_brand_profile(brand_profile_id=brand_profile_id, user_id=user_id)
        if not existing:
            return False
        await self.db_client.execute(
            "DELETE FROM brand_profiles WHERE id = ? AND user_id = ?",
            [brand_profile_id, user_id],
        )
        return True

    async def _clear_project_default(self, *, user_id: str, project_id: str) -> None:
        await self.db_client.execute(
            """
            UPDATE brand_profiles
            SET is_default = 0
            WHERE user_id = ? AND project_id = ? AND is_default = 1
            """,
            [user_id, project_id],
        )


brand_profile_store = BrandProfileStore()

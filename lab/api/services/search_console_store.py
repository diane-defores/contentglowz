"""Persistence for Google Search Console OAuth, connection, and snapshots."""

from __future__ import annotations

import json
import os
import secrets
from datetime import datetime
from typing import Any

from api.services.crypto import get_crypto
from utils.libsql_async import create_client


def _ts(raw: Any) -> datetime:
    if isinstance(raw, datetime):
        return raw
    if isinstance(raw, (int, float)):
        return datetime.fromtimestamp(raw)
    if isinstance(raw, str):
        try:
            return datetime.fromisoformat(raw)
        except ValueError:
            return datetime.fromtimestamp(float(raw))
    return datetime.now()


def _json_load(raw: Any, fallback: Any = None) -> Any:
    if raw is None:
        return fallback
    if isinstance(raw, (dict, list)):
        return raw
    if isinstance(raw, (bytes, bytearray)):
        raw = raw.decode("utf-8")
    try:
        return json.loads(raw)
    except Exception:
        return fallback


def _json_dump(raw: Any) -> str | None:
    if raw is None:
        return None
    return json.dumps(raw)


def _token_payload_from_raw(payload: Any) -> dict[str, Any] | None:
    if payload is None:
        return None
    if isinstance(payload, (bytes, bytearray)):
        payload = payload.decode("utf-8")
    if isinstance(payload, dict):
        return payload
    if isinstance(payload, str):
        payload = payload.strip()
        if not payload:
            return None
        return {"token": payload}
    return None


class SearchConsoleStore:
    """Storage for Search Console credentials and snapshots."""

    def __init__(self) -> None:
        self.db_client = None
        if os.getenv("TURSO_DATABASE_URL") and os.getenv("TURSO_AUTH_TOKEN"):
            self.db_client = create_client(
                url=os.getenv("TURSO_DATABASE_URL"),
                auth_token=os.getenv("TURSO_AUTH_TOKEN"),
            )

    def _ensure_connected(self) -> None:
        if not self.db_client:
            raise RuntimeError(
                "Database not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN."
            )

    @staticmethod
    def _require_encryption() -> None:
        # Raises clearly when secrets key is missing.
        get_crypto()

    def _connection_from_row(self, row: tuple[Any, ...]) -> dict[str, Any]:
        token_payload = row[7]
        token_payload_dict = _token_payload_from_raw(token_payload)
        token_expires_at = (
            _ts(token_payload_dict.get("expires_at"))
            if token_payload_dict and token_payload_dict.get("expires_at")
            else None
        )

        return {
            "id": row[0],
            "userId": row[1],
            "projectId": row[2],
            "propertyUrl": row[3],
            "status": row[4] or "missing",
            "accountEmail": row[5],
            "scopes": _json_load(row[6], []),
            "token": token_payload,
            "tokenExpiresAt": token_expires_at,
            "connectedAt": _ts(row[8]) if row[8] else None,
            "syncedAt": _ts(row[9]) if row[9] else None,
            "lastSyncStatus": row[10],
            "lastSyncMessage": row[11],
            "updatedAt": _ts(row[12]),
            "createdAt": _ts(row[13]),
        }

    def _state_from_row(self, row: tuple[Any, ...]) -> dict[str, Any]:
        return {
            "state": row[0],
            "userId": row[1],
            "projectId": row[2],
            "redirectIntent": row[3],
            "createdAt": _ts(row[4]),
            "expiresAt": _ts(row[5]),
            "consumedAt": _ts(row[6]) if row[6] else None,
            "used": bool(row[7]),
        }

    def _snapshot_from_row(self, row: tuple[Any, ...]) -> dict[str, Any]:
        return {
            "id": row[0],
            "userId": row[1],
            "projectId": row[2],
            "propertyUrl": row[3],
            "period": row[4],
            "syncedAt": _ts(row[5]) if row[5] else None,
            "isPartial": bool(row[6]),
            "googleSearchPayload": _json_load(row[7], {}),
            "analyticsPayload": _json_load(row[8], {}),
            "errorMessage": row[9],
            "status": row[10] or "ok",
            "updatedAt": _ts(row[11]),
            "createdAt": _ts(row[12]),
        }

    async def ensure_tables(self) -> None:
        """Create Search Console storage tables if they do not exist."""
        self._ensure_connected()
        await self.db_client.execute(
            """
            CREATE TABLE IF NOT EXISTS SearchConsoleConnection (
                id TEXT PRIMARY KEY NOT NULL,
                userId TEXT NOT NULL,
                projectId TEXT NOT NULL,
                propertyUrl TEXT,
                status TEXT NOT NULL DEFAULT 'missing',
                accountEmail TEXT,
                scopes TEXT,
                tokenData TEXT,
                connectedAt INTEGER,
                syncedAt INTEGER,
                lastSyncStatus TEXT,
                lastSyncMessage TEXT,
                createdAt INTEGER NOT NULL,
                updatedAt INTEGER NOT NULL,
                UNIQUE(userId, projectId)
            )
            """
        )
        await self.db_client.execute(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS idx_search_console_conn_scope
            ON SearchConsoleConnection (userId, projectId)
            """
        )
        await self.db_client.execute(
            """
            CREATE TABLE IF NOT EXISTS SearchConsoleOAuthState (
                state TEXT PRIMARY KEY NOT NULL,
                userId TEXT NOT NULL,
                projectId TEXT NOT NULL,
                redirectIntent TEXT NOT NULL DEFAULT 'callback',
                createdAt INTEGER NOT NULL,
                expiresAt INTEGER NOT NULL,
                consumedAt INTEGER,
                used INTEGER NOT NULL DEFAULT 0
            )
            """
        )
        await self.db_client.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_search_console_state_ttl
            ON SearchConsoleOAuthState (projectId, expiresAt)
            """
        )
        await self.db_client.execute(
            """
            CREATE TABLE IF NOT EXISTS SearchConsoleSnapshot (
                id TEXT PRIMARY KEY NOT NULL,
                userId TEXT NOT NULL,
                projectId TEXT NOT NULL,
                propertyUrl TEXT NOT NULL,
                period TEXT NOT NULL,
                syncedAt INTEGER,
                isPartial INTEGER NOT NULL DEFAULT 0,
                googleSearchPayload TEXT,
                analyticsPayload TEXT,
                errorMessage TEXT,
                status TEXT NOT NULL DEFAULT 'ok',
                createdAt INTEGER NOT NULL,
                updatedAt INTEGER NOT NULL,
                UNIQUE(userId, projectId, propertyUrl, period)
            )
            """
        )
        await self.db_client.execute(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS idx_search_console_snapshot_scope
            ON SearchConsoleSnapshot (userId, projectId, propertyUrl, period)
            """
        )

    # ---- OAuth state ----

    async def create_oauth_state(
        self,
        user_id: str,
        project_id: str,
        redirect_intent: str = "callback",
        ttl_seconds: int = 600,
    ) -> dict[str, Any]:
        self._ensure_connected()
        now = int(datetime.now().timestamp())
        state = secrets.token_urlsafe(32)
        await self.db_client.execute(
            """
            INSERT INTO SearchConsoleOAuthState (
                state, userId, projectId, redirectIntent, createdAt, expiresAt, consumedAt, used
            ) VALUES (?, ?, ?, ?, ?, ?, NULL, 0)
            """,
            [state, user_id, project_id, redirect_intent, now, now + ttl_seconds],
        )
        return {
            "state": state,
            "userId": user_id,
            "projectId": project_id,
            "redirectIntent": redirect_intent,
            "createdAt": _ts(now),
            "expiresAt": _ts(now + ttl_seconds),
            "consumedAt": None,
            "used": False,
        }

    async def consume_oauth_state(self, state: str) -> dict[str, Any] | None:
        self._ensure_connected()
        now = int(datetime.now().timestamp())

        async def _consume() -> dict[str, Any] | None:
            rows = await self.db_client.execute(
                """
                UPDATE SearchConsoleOAuthState
                SET consumedAt = ?, used = 1
                WHERE state = ? AND expiresAt >= ? AND used = 0
                RETURNING state, userId, projectId, redirectIntent, createdAt, expiresAt, consumedAt, used
                """,
                [now, state, now],
            )
            if not rows.rows:
                return None
            return self._state_from_row(rows.rows[0])

        try:
            return await _consume()
        except Exception:
            rs = await self.db_client.execute(
                """
                SELECT state, userId, projectId, redirectIntent, createdAt, expiresAt, consumedAt, used
                FROM SearchConsoleOAuthState
                WHERE state = ? AND expiresAt >= ?
                LIMIT 1
                """,
                [state, now],
            )
            if not rs.rows:
                return None
            state_row = self._state_from_row(rs.rows[0])
            if state_row.get("used"):
                return None
            await self.db_client.execute(
                """
                UPDATE SearchConsoleOAuthState
                SET used = 1, consumedAt = ?
                WHERE state = ? AND used = 0
                """,
                [now, state],
            )
            state_row["used"] = True
            state_row["consumedAt"] = _ts(now)
            return state_row

    # ---- Connection ----

    async def get_connection(self, user_id: str, project_id: str) -> dict[str, Any] | None:
        self._ensure_connected()
        rs = await self.db_client.execute(
            """
            SELECT id, userId, projectId, propertyUrl, status, accountEmail,
                   scopes, tokenData, connectedAt, syncedAt, lastSyncStatus, lastSyncMessage,
                   updatedAt, createdAt
            FROM SearchConsoleConnection
            WHERE userId = ? AND projectId = ?
            LIMIT 1
            """,
            [user_id, project_id],
        )
        if not rs.rows:
            return None
        return self._connection_from_row(rs.rows[0])

    async def upsert_connection(
        self,
        user_id: str,
        project_id: str,
        property_url: str | None = None,
        status: str = "connected",
        account_email: str | None = None,
        scopes: list[str] | None = None,
        token_payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        self._ensure_connected()
        now = int(datetime.now().timestamp())
        existing = await self.get_connection(user_id, project_id)
        encrypted_payload: str | None = None

        if token_payload is not None:
            self._require_encryption()
            token_payload = {**token_payload}
            token_payload["updatedAt"] = datetime.now().isoformat()
            encrypted_payload = get_crypto().encrypt(_json_dump(token_payload))

        if existing:
            await self.db_client.execute(
                """
                UPDATE SearchConsoleConnection
                SET propertyUrl = COALESCE(?, propertyUrl),
                    status = ?,
                    accountEmail = COALESCE(?, accountEmail),
                    scopes = COALESCE(?, scopes),
                    tokenData = COALESCE(?, tokenData),
                    syncedAt = ?,
                    updatedAt = ?
                WHERE id = ?
                """,
                [
                    property_url,
                    status,
                    account_email,
                    _json_dump(scopes),
                    encrypted_payload,
                    now if token_payload else existing.get("syncedAt") and int(existing["syncedAt"].timestamp()) or None,
                    now,
                    existing["id"],
                ],
            )
            return await self.get_connection(user_id, project_id)  # type: ignore[return-value]

        await self.db_client.execute(
            """
            INSERT INTO SearchConsoleConnection (
                id, userId, projectId, propertyUrl, status, accountEmail, scopes,
                tokenData, connectedAt, syncedAt, lastSyncStatus, lastSyncMessage, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                f"{user_id}:{project_id}:gsc",
                user_id,
                project_id,
                property_url,
                status,
                account_email,
                _json_dump(scopes),
                encrypted_payload,
                now,
                now,
                None,
                None,
                now,
                now,
            ],
        )
        created = await self.get_connection(user_id, project_id)
        if not created:
            raise RuntimeError("Failed to persist Search Console connection")
        return created

    async def delete_connection(self, user_id: str, project_id: str) -> bool:
        self._ensure_connected()
        await self.db_client.execute(
            "DELETE FROM SearchConsoleConnection WHERE userId = ? AND projectId = ?",
            [user_id, project_id],
        )
        return True

    async def set_connection_status(
        self,
        user_id: str,
        project_id: str,
        status: str,
        synced_at: int | None = None,
        last_sync_status: str | None = None,
        last_sync_message: str | None = None,
    ) -> None:
        self._ensure_connected()
        await self.db_client.execute(
            """
            UPDATE SearchConsoleConnection
            SET status = ?,
                syncedAt = COALESCE(?, syncedAt),
                lastSyncStatus = COALESCE(?, lastSyncStatus),
                lastSyncMessage = COALESCE(?, lastSyncMessage),
                updatedAt = ?
            WHERE userId = ? AND projectId = ?
            """,
            [
                status,
                synced_at,
                last_sync_status,
                last_sync_message,
                int(datetime.now().timestamp()),
                user_id,
                project_id,
            ],
        )

    # ---- OAuth tokens ----

    async def get_connection_token_payload(
        self,
        user_id: str,
        project_id: str,
    ) -> dict[str, Any] | None:
        connection = await self.get_connection(user_id, project_id)
        if not connection or not connection.get("token"):
            return None
        encrypted = connection["token"]
        self._require_encryption()
        return self._token_payload_from_encrypted(encrypted)

    @staticmethod
    def _token_payload_from_encrypted(payload: Any) -> dict[str, Any] | None:
        raw: dict[str, Any] | None = None
        if isinstance(payload, dict):
            raw = payload
        elif isinstance(payload, str):
            try:
                raw = json.loads(get_crypto().decrypt(payload))
            except Exception:
                return None
        if not isinstance(raw, dict):
            return None
        return raw

    async def set_connection_tokens(
        self,
        user_id: str,
        project_id: str,
        token_payload: dict[str, Any],
    ) -> None:
        self._require_encryption()
        self._ensure_connected()
        now = int(datetime.now().timestamp())
        token_payload = dict(token_payload)
        if isinstance(token_payload.get("expires_at"), datetime):
            token_payload["expires_at"] = token_payload["expires_at"].isoformat()

        if "savedAt" not in token_payload:
            token_payload["savedAt"] = _ts(now).isoformat()

        encrypted = get_crypto().encrypt(_json_dump(token_payload))
        await self.db_client.execute(
            """
            UPDATE SearchConsoleConnection
            SET tokenData = ?,
                updatedAt = ?,
                syncedAt = ?
            WHERE userId = ? AND projectId = ?
            """,
            [encrypted, now, now, user_id, project_id],
        )

    async def clear_connection_tokens(self, user_id: str, project_id: str) -> None:
        self._ensure_connected()
        await self.db_client.execute(
            """
            UPDATE SearchConsoleConnection
            SET tokenData = NULL,
                status = 'disconnected',
                updatedAt = ?,
                syncedAt = ?
            WHERE userId = ? AND projectId = ?
            """,
            [int(datetime.now().timestamp()), int(datetime.now().timestamp()), user_id, project_id],
        )

    # ---- Snapshot cache ----

    async def upsert_snapshot(
        self,
        user_id: str,
        project_id: str,
        property_url: str,
        period: str,
        *,
        is_partial: bool = False,
        google_payload: dict[str, Any] | None = None,
        analytics_payload: dict[str, Any] | None = None,
        error_message: str | None = None,
        status: str = "ok",
    ) -> dict[str, Any]:
        self._ensure_connected()
        now = int(datetime.now().timestamp())
        snapshot_id = f"{user_id}:{project_id}:{period}:{property_url}"

        existing = await self.get_snapshot(user_id, project_id, property_url, period)
        if existing:
            await self.db_client.execute(
                """
                UPDATE SearchConsoleSnapshot
                SET syncedAt = ?, isPartial = ?, googleSearchPayload = ?, analyticsPayload = ?,
                    errorMessage = ?, status = ?, updatedAt = ?
                WHERE id = ?
                """,
                [
                    now,
                    1 if is_partial else 0,
                    _json_dump(google_payload),
                    _json_dump(analytics_payload),
                    error_message,
                    status,
                    now,
                    existing["id"],
                ],
            )
            return await self.get_snapshot(user_id, project_id, property_url, period)  # type: ignore[return-value]

        await self.db_client.execute(
            """
            INSERT INTO SearchConsoleSnapshot (
                id, userId, projectId, propertyUrl, period, syncedAt, isPartial,
                googleSearchPayload, analyticsPayload, errorMessage, status, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                snapshot_id,
                user_id,
                project_id,
                property_url,
                period,
                now,
                1 if is_partial else 0,
                _json_dump(google_payload),
                _json_dump(analytics_payload),
                error_message,
                status,
                now,
                now,
            ],
        )
        created = await self.get_snapshot(user_id, project_id, property_url, period)
        if not created:
            raise RuntimeError("Failed to persist Search Console snapshot")
        return created

    async def get_snapshot(
        self,
        user_id: str,
        project_id: str,
        property_url: str,
        period: str,
    ) -> dict[str, Any] | None:
        self._ensure_connected()
        rs = await self.db_client.execute(
            """
            SELECT id, userId, projectId, propertyUrl, period, syncedAt, isPartial,
                   googleSearchPayload, analyticsPayload, errorMessage, status, updatedAt, createdAt
            FROM SearchConsoleSnapshot
            WHERE userId = ? AND projectId = ? AND propertyUrl = ? AND period = ?
            LIMIT 1
            """,
            [user_id, project_id, property_url, period],
        )
        if not rs.rows:
            return None
        return self._snapshot_from_row(rs.rows[0])


search_console_store = SearchConsoleStore()

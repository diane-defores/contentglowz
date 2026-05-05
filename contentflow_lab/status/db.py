"""Status database helpers backed by Turso/libsql.

This module intentionally no longer persists lifecycle data to a local SQLite
file. All durable status data is stored in Turso; only explicit in-memory or
temporary runtime state may remain local elsewhere in the app.
"""

from __future__ import annotations

import os
import sqlite3
from pathlib import Path
from typing import Optional

from utils.libsql_sync import Connection, create_connection

MIGRATION_PATH = (
    Path(__file__).resolve().parent.parent / "api" / "migrations" / "004_status_lifecycle.sql"
)


def get_connection(db_path: Optional[str] = None) -> Connection:
    """Create a libsql connection to Turso or an explicit override URL."""

    url = (db_path or os.environ.get("TURSO_DATABASE_URL", "") or "").strip()
    auth_token = os.environ.get("TURSO_AUTH_TOKEN", "").strip()
    if not url:
        raise RuntimeError(
            "Status database not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN."
        )
    return create_connection(url=url, auth_token=auth_token)


def init_db(conn: Connection) -> None:
    """Create all status-domain tables if they do not exist."""

    if not MIGRATION_PATH.exists():
        raise RuntimeError(f"Missing status schema migration: {MIGRATION_PATH}")
    conn.executescript(MIGRATION_PATH.read_text(encoding="utf-8"))
    conn.commit()
    _run_migrations(conn)


def _run_migrations(conn: Connection) -> None:
    """Add columns/indexes needed by older lifecycle rows, idempotently."""

    for stmt in [
        "ALTER TABLE idea_pool ADD COLUMN user_id TEXT",
        "ALTER TABLE content_records ADD COLUMN user_id TEXT",
        "ALTER TABLE content_records ADD COLUMN current_version INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE content_records ADD COLUMN review_actor_type TEXT",
        "ALTER TABLE content_records ADD COLUMN review_actor_id TEXT",
        "ALTER TABLE content_records ADD COLUMN review_actor_label TEXT",
        "ALTER TABLE content_records ADD COLUMN review_actor_metadata TEXT",
        "ALTER TABLE status_changes ADD COLUMN actor_type TEXT",
        "ALTER TABLE status_changes ADD COLUMN actor_id TEXT",
        "ALTER TABLE status_changes ADD COLUMN actor_label TEXT",
        "ALTER TABLE status_changes ADD COLUMN actor_metadata TEXT",
        "ALTER TABLE content_edits ADD COLUMN actor_type TEXT",
        "ALTER TABLE content_edits ADD COLUMN actor_id TEXT",
        "ALTER TABLE content_edits ADD COLUMN actor_label TEXT",
        "ALTER TABLE content_edits ADD COLUMN actor_metadata TEXT",
        """
        CREATE TABLE IF NOT EXISTS content_assets (
            id TEXT PRIMARY KEY,
            content_id TEXT NOT NULL,
            project_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            client_asset_id TEXT,
            source TEXT NOT NULL DEFAULT 'device_capture',
            kind TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            file_name TEXT,
            byte_size INTEGER,
            width INTEGER,
            height INTEGER,
            duration_ms INTEGER,
            storage_uri TEXT,
            status TEXT NOT NULL DEFAULT 'local_only',
            metadata TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            deleted_at TEXT
        )
        """,
    ]:
        try:
            conn.execute(stmt)
        except sqlite3.OperationalError:
            pass
        except Exception as exc:
            message = str(exc).lower()
            if "duplicate column" in message or "already exists" in message:
                continue
            raise

    for stmt in [
        "CREATE INDEX IF NOT EXISTS idx_ideas_user ON idea_pool(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_content_user ON content_records(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_content_updated_at ON content_records(updated_at)",
        "CREATE INDEX IF NOT EXISTS idx_content_review_actor_id ON content_records(review_actor_id)",
        "CREATE INDEX IF NOT EXISTS idx_jobs_user ON schedule_jobs(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_jobs_project ON schedule_jobs(project_id)",
        "CREATE INDEX IF NOT EXISTS idx_changes_actor_id ON status_changes(actor_id)",
        "CREATE INDEX IF NOT EXISTS idx_edits_actor_id ON content_edits(actor_id)",
        "CREATE INDEX IF NOT EXISTS idx_assets_content ON content_assets(content_id)",
        "CREATE INDEX IF NOT EXISTS idx_assets_project ON content_assets(project_id)",
        "CREATE INDEX IF NOT EXISTS idx_assets_user ON content_assets(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_assets_client ON content_assets(content_id, client_asset_id)",
    ]:
        conn.execute(stmt)
    conn.commit()

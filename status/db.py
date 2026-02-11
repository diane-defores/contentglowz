"""
Status Database - SQLite storage for content lifecycle tracking.

Uses stdlib sqlite3 (zero new dependencies). WAL mode for concurrency.
"""

import os
import sqlite3
from pathlib import Path
from typing import Optional

DEFAULT_DB_PATH = os.environ.get(
    "STATUS_DB_PATH",
    str(Path(__file__).parent.parent / "data" / "status" / "status.db"),
)


def get_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    """
    Create a SQLite connection with WAL mode and row factory.
    """
    path = db_path or DEFAULT_DB_PATH
    Path(path).parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db(conn: sqlite3.Connection) -> None:
    """
    Create all tables if they don't exist.
    """
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS content_records (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content_type TEXT NOT NULL,
            source_robot TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'todo',
            project_id TEXT,
            content_path TEXT,
            content_preview TEXT,
            content_hash TEXT,
            priority INTEGER NOT NULL DEFAULT 3,
            tags TEXT NOT NULL DEFAULT '[]',
            metadata TEXT NOT NULL DEFAULT '{}',
            target_url TEXT,
            reviewer_note TEXT,
            reviewed_by TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            scheduled_for TEXT,
            published_at TEXT,
            synced_at TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_content_status ON content_records(status);
        CREATE INDEX IF NOT EXISTS idx_content_type ON content_records(content_type);
        CREATE INDEX IF NOT EXISTS idx_content_project ON content_records(project_id);
        CREATE INDEX IF NOT EXISTS idx_content_source ON content_records(source_robot);

        CREATE TABLE IF NOT EXISTS status_changes (
            id TEXT PRIMARY KEY,
            content_id TEXT NOT NULL,
            from_status TEXT NOT NULL,
            to_status TEXT NOT NULL,
            changed_by TEXT NOT NULL,
            reason TEXT,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (content_id) REFERENCES content_records(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_changes_content ON status_changes(content_id);
        CREATE INDEX IF NOT EXISTS idx_changes_timestamp ON status_changes(timestamp);

        CREATE TABLE IF NOT EXISTS work_domains (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            domain TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'idle',
            last_run_at TEXT,
            last_run_status TEXT,
            items_pending INTEGER NOT NULL DEFAULT 0,
            items_completed INTEGER NOT NULL DEFAULT 0,
            metadata TEXT NOT NULL DEFAULT '{}',
            updated_at TEXT NOT NULL,
            UNIQUE(project_id, domain)
        );

        CREATE INDEX IF NOT EXISTS idx_domains_project ON work_domains(project_id);

        CREATE TABLE IF NOT EXISTS sync_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            direction TEXT NOT NULL,
            records_synced INTEGER NOT NULL DEFAULT 0,
            started_at TEXT NOT NULL,
            completed_at TEXT,
            status TEXT NOT NULL DEFAULT 'running',
            error TEXT
        );
        """
    )
    conn.commit()

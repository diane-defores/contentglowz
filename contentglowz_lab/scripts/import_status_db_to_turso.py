"""Import a legacy local status.db into the Turso-backed lifecycle schema.

The script is intentionally idempotent: repeated executions use
``INSERT OR REPLACE`` for row-keyed tables so a stale local database can be
replayed without manual cleanup.
"""

from __future__ import annotations

import argparse
import sqlite3
from pathlib import Path

from status.db import get_connection, init_db

TABLES = [
    "content_records",
    "status_changes",
    "work_domains",
    "content_bodies",
    "content_edits",
    "schedule_jobs",
    "content_templates",
    "template_sections",
    "idea_pool",
    "drip_plans",
    "api_cost_log",
]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Import an old local status.db into Turso.",
    )
    parser.add_argument(
        "source_db",
        help="Path to the legacy SQLite status.db file",
    )
    args = parser.parse_args()

    source_path = Path(args.source_db).expanduser().resolve()
    if not source_path.exists():
        raise SystemExit(f"Source database not found: {source_path}")

    source = sqlite3.connect(str(source_path))
    source.row_factory = sqlite3.Row
    target = get_connection()
    init_db(target)

    imported = 0
    for table in TABLES:
        if not _table_exists(source, table):
            print(f"skip {table}: missing in source")
            continue

        rows = source.execute(f"SELECT * FROM {table}").fetchall()
        if not rows:
            print(f"skip {table}: 0 rows")
            continue

        columns = [col[1] for col in source.execute(f"PRAGMA table_info({table})").fetchall()]
        placeholders = ", ".join("?" for _ in columns)
        col_sql = ", ".join(columns)
        sql = f"INSERT OR REPLACE INTO {table} ({col_sql}) VALUES ({placeholders})"

        for row in rows:
            target.execute(sql, [row[col] for col in columns])

        imported += len(rows)
        print(f"imported {table}: {len(rows)} rows")

    target.commit()
    source.close()
    print(f"done: {imported} rows imported from {source_path}")
    return 0


def _table_exists(conn: sqlite3.Connection, table: str) -> bool:
    row = conn.execute(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
        (table,),
    ).fetchone()
    return row is not None


if __name__ == "__main__":
    raise SystemExit(main())

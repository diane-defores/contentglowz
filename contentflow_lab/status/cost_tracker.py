"""
API Cost Tracker — Persistent cost tracking for external API calls.

Stores per-job cost data in Turso alongside the lifecycle tables.
Query with get_cost_summary() to see costs by project, job type, or time range.

Usage:
    from status.cost_tracker import log_job_costs, get_cost_summary

    # After a job completes:
    log_job_costs("job-123", "proj-456", "ingest_seo", metrics_dict)

    # Query costs:
    summary = get_cost_summary(project_id="proj-456")
    print(f"Total: ${summary['total_cost']}")
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from status.db import get_connection

logger = logging.getLogger(__name__)

_TABLE_READY = False


def _ensure_table() -> None:
    global _TABLE_READY
    if _TABLE_READY:
        return

    conn = get_connection()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS api_cost_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            project_id TEXT,
            job_id TEXT,
            job_type TEXT NOT NULL,
            pipeline TEXT NOT NULL,
            mode TEXT NOT NULL,
            standard_calls INTEGER NOT NULL DEFAULT 0,
            live_calls INTEGER NOT NULL DEFAULT 0,
            estimated_cost REAL NOT NULL DEFAULT 0.0,
            duration_seconds REAL NOT NULL DEFAULT 0.0,
            provider TEXT NOT NULL DEFAULT 'dataforseo'
        );

        CREATE INDEX IF NOT EXISTS idx_cost_project ON api_cost_log(project_id);
        CREATE INDEX IF NOT EXISTS idx_cost_timestamp ON api_cost_log(timestamp);
        CREATE INDEX IF NOT EXISTS idx_cost_job_type ON api_cost_log(job_type);
        CREATE INDEX IF NOT EXISTS idx_cost_job_id ON api_cost_log(job_id);
    """)
    _TABLE_READY = True


def log_job_costs(
    job_id: str,
    project_id: Optional[str],
    job_type: str,
    metrics: Dict[str, Dict[str, float]],
    provider: str = "dataforseo",
) -> int:
    """Persist pipeline metrics from a completed job.

    Args:
        job_id: Schedule job ID
        project_id: Project scope
        job_type: e.g. "ingest_seo", "enrich_ideas"
        metrics: Output of flush_metrics() — {pipeline: {standard_calls, live_calls, ...}}

    Returns:
        Number of rows inserted.
    """
    if not metrics:
        return 0

    _ensure_table()
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    inserted = 0

    for pipeline, m in metrics.items():
        std_calls = int(m.get("standard_calls", 0))
        live_calls = int(m.get("live_calls", 0))
        if std_calls == 0 and live_calls == 0:
            continue

        mode = "standard" if std_calls >= live_calls else "live"
        total_time = m.get("standard_time", 0.0) + m.get("live_time", 0.0)

        conn.execute(
            """INSERT INTO api_cost_log
               (timestamp, project_id, job_id, job_type, pipeline, mode,
                standard_calls, live_calls, estimated_cost, duration_seconds, provider)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                now, project_id, job_id, job_type, pipeline, mode,
                std_calls, live_calls,
                round(m.get("estimated_cost", 0.0), 4),
                round(total_time, 3),
                provider,
            ),
        )
        inserted += 1

    conn.commit()
    logger.info("Logged %d cost entries for job %s (type=%s)", inserted, job_id, job_type)
    return inserted


def get_cost_summary(
    project_id: Optional[str] = None,
    since: Optional[str] = None,
    until: Optional[str] = None,
) -> Dict[str, Any]:
    """Aggregate costs for pricing analysis.

    Returns total cost, breakdown by job type, by pipeline, and daily history.
    """
    _ensure_table()
    conn = get_connection()

    conditions: List[str] = []
    params: List[str] = []

    if project_id:
        conditions.append("project_id = ?")
        params.append(project_id)
    if since:
        conditions.append("timestamp >= ?")
        params.append(since)
    if until:
        conditions.append("timestamp <= ?")
        params.append(until)

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    # Total
    row = conn.execute(
        f"""SELECT COALESCE(SUM(estimated_cost), 0),
                   COALESCE(SUM(standard_calls + live_calls), 0),
                   COUNT(DISTINCT job_id)
            FROM api_cost_log {where}""",
        params,
    ).fetchone()

    # By job type
    rows = conn.execute(
        f"""SELECT job_type,
                   SUM(estimated_cost),
                   SUM(standard_calls + live_calls),
                   COUNT(DISTINCT job_id)
            FROM api_cost_log {where}
            GROUP BY job_type ORDER BY SUM(estimated_cost) DESC""",
        params,
    ).fetchall()
    by_job_type = [
        {"job_type": r[0], "cost": round(r[1], 3), "api_tasks": r[2], "job_runs": r[3]}
        for r in rows
    ]

    # By pipeline
    rows = conn.execute(
        f"""SELECT pipeline, mode,
                   SUM(estimated_cost),
                   SUM(standard_calls + live_calls)
            FROM api_cost_log {where}
            GROUP BY pipeline, mode ORDER BY SUM(estimated_cost) DESC""",
        params,
    ).fetchall()
    by_pipeline = [
        {"pipeline": r[0], "mode": r[1], "cost": round(r[2], 3), "api_tasks": r[3]}
        for r in rows
    ]

    # Daily breakdown (last 30 days)
    thirty_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
    day_conditions = conditions + ["timestamp >= ?"]
    day_params = params + [thirty_ago]
    day_where = f"WHERE {' AND '.join(day_conditions)}"

    rows = conn.execute(
        f"""SELECT SUBSTR(timestamp, 1, 10) as day,
                   SUM(estimated_cost),
                   SUM(standard_calls + live_calls)
            FROM api_cost_log {day_where}
            GROUP BY day ORDER BY day""",
        day_params,
    ).fetchall()
    daily = [{"date": r[0], "cost": round(r[1], 3), "api_tasks": r[2]} for r in rows]

    return {
        "total_cost": round(row[0], 3),
        "total_api_tasks": row[1],
        "total_job_runs": row[2],
        "by_job_type": by_job_type,
        "by_pipeline": by_pipeline,
        "daily_last_30d": daily,
        "query": {"project_id": project_id, "since": since, "until": until},
    }


def get_cost_per_project() -> List[Dict[str, Any]]:
    """Cost breakdown per project — useful for pricing decisions."""
    _ensure_table()
    conn = get_connection()

    rows = conn.execute("""
        SELECT project_id,
               SUM(estimated_cost),
               SUM(standard_calls + live_calls),
               COUNT(DISTINCT job_id),
               MIN(timestamp),
               MAX(timestamp)
        FROM api_cost_log
        GROUP BY project_id
        ORDER BY SUM(estimated_cost) DESC
    """).fetchall()

    return [
        {
            "project_id": r[0] or "(no project)",
            "total_cost": round(r[1], 3),
            "total_api_tasks": r[2],
            "total_job_runs": r[3],
            "first_run": r[4],
            "last_run": r[5],
        }
        for r in rows
    ]

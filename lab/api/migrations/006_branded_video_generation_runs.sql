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
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_branded_video_generation_runs_content
ON branded_video_generation_runs(user_id, project_id, content_id, format_preset);

CREATE INDEX IF NOT EXISTS idx_branded_video_generation_runs_project
ON branded_video_generation_runs(project_id, user_id, updated_at);

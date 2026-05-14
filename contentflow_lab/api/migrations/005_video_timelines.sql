CREATE TABLE IF NOT EXISTS video_timelines (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    content_id TEXT NOT NULL,
    format_preset TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    current_version_id TEXT,
    draft_revision INTEGER NOT NULL DEFAULT 0,
    draft_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_video_timelines_active_content
ON video_timelines(user_id, project_id, content_id, format_preset)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_video_timelines_project
ON video_timelines(project_id, user_id, updated_at);

CREATE TABLE IF NOT EXISTS video_timeline_versions (
    id TEXT PRIMARY KEY,
    timeline_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    content_id TEXT NOT NULL,
    format_preset TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    timeline_json TEXT NOT NULL,
    renderer_props_json TEXT NOT NULL DEFAULT '{}',
    approved_preview_job_id TEXT,
    preview_approved_at TEXT,
    client_request_id TEXT,
    created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_video_timeline_versions_number
ON video_timeline_versions(timeline_id, version_number);

CREATE INDEX IF NOT EXISTS idx_video_timeline_versions_owner
ON video_timeline_versions(project_id, user_id, created_at);

CREATE TABLE IF NOT EXISTS video_timeline_render_jobs (
    job_id TEXT PRIMARY KEY,
    timeline_id TEXT NOT NULL,
    version_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    render_mode TEXT NOT NULL,
    status TEXT NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0,
    message TEXT,
    artifact_json TEXT,
    worker_job_id TEXT,
    parent_preview_job_id TEXT,
    client_request_id TEXT,
    stale INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_video_timeline_jobs_version
ON video_timeline_render_jobs(timeline_id, version_id, render_mode, created_at);

CREATE INDEX IF NOT EXISTS idx_video_timeline_jobs_owner
ON video_timeline_render_jobs(project_id, user_id, status, updated_at);

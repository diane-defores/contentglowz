CREATE TABLE IF NOT EXISTS video_source_folders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    content_id TEXT NOT NULL,
    purpose TEXT NOT NULL DEFAULT 'video_source_intake',
    status TEXT NOT NULL DEFAULT 'collecting',
    revision INTEGER NOT NULL DEFAULT 0,
    ready_revision INTEGER,
    ready_by TEXT,
    ready_at TEXT,
    enqueue_status TEXT NOT NULL DEFAULT 'not_requested',
    generation_request_id TEXT,
    generation_error_code TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    archived_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_video_source_folder_active
ON video_source_folders(user_id, project_id, content_id, purpose)
WHERE archived_at IS NULL;

CREATE TABLE IF NOT EXISTS video_sources (
    id TEXT PRIMARY KEY,
    folder_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    source_type TEXT NOT NULL,
    status TEXT NOT NULL,
    asset_id TEXT,
    text_body TEXT,
    text_preview TEXT,
    raw_hash TEXT,
    normalized_hash TEXT,
    canonical_url TEXT,
    link_hostname TEXT,
    safe_metadata_json TEXT NOT NULL DEFAULT '{}',
    error_code TEXT,
    retryable INTEGER NOT NULL DEFAULT 0,
    idempotency_key TEXT NOT NULL,
    replacement_of_source_id TEXT,
    superseded_by_source_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    removed_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_video_source_idempotency
ON video_sources(folder_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_video_sources_folder_active
ON video_sources(folder_id, status, updated_at);
CREATE INDEX IF NOT EXISTS idx_video_sources_asset
ON video_sources(asset_id);

CREATE TABLE IF NOT EXISTS video_source_upload_sessions (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    folder_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    content_id TEXT NOT NULL,
    expected_revision INTEGER NOT NULL,
    source_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    byte_size INTEGER NOT NULL,
    checksum_sha256 TEXT NOT NULL,
    provider_namespace TEXT NOT NULL,
    mode TEXT NOT NULL,
    provider_state_json TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    locator_json TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_video_source_upload_idempotency
ON video_source_upload_sessions(folder_id, idempotency_key);

CREATE TABLE IF NOT EXISTS video_source_generation_handoffs (
    id TEXT PRIMARY KEY,
    folder_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    content_id TEXT NOT NULL,
    ready_revision INTEGER NOT NULL,
    idempotency_key TEXT NOT NULL,
    descriptor_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'enqueue_pending',
    canonical_request_id TEXT,
    error_code TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_video_source_handoff_idempotency
ON video_source_generation_handoffs(folder_id, ready_revision, idempotency_key);

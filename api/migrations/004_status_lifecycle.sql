CREATE TABLE IF NOT EXISTS content_records (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content_type TEXT NOT NULL,
    source_robot TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'todo',
    project_id TEXT,
    user_id TEXT,
    content_path TEXT,
    content_preview TEXT,
    content_hash TEXT,
    priority INTEGER NOT NULL DEFAULT 3,
    tags TEXT NOT NULL DEFAULT '[]',
    metadata TEXT NOT NULL DEFAULT '{}',
    target_url TEXT,
    reviewer_note TEXT,
    reviewed_by TEXT,
    review_actor_type TEXT,
    review_actor_id TEXT,
    review_actor_label TEXT,
    review_actor_metadata TEXT,
    current_version INTEGER NOT NULL DEFAULT 0,
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
CREATE INDEX IF NOT EXISTS idx_content_user ON content_records(user_id);
CREATE INDEX IF NOT EXISTS idx_content_updated_at ON content_records(updated_at);

CREATE TABLE IF NOT EXISTS status_changes (
    id TEXT PRIMARY KEY,
    content_id TEXT NOT NULL,
    from_status TEXT NOT NULL,
    to_status TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    actor_type TEXT,
    actor_id TEXT,
    actor_label TEXT,
    actor_metadata TEXT,
    reason TEXT,
    timestamp TEXT NOT NULL
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

CREATE TABLE IF NOT EXISTS content_bodies (
    id TEXT PRIMARY KEY,
    content_id TEXT NOT NULL,
    body TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    edited_by TEXT,
    edit_note TEXT,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bodies_content ON content_bodies(content_id);
CREATE INDEX IF NOT EXISTS idx_bodies_version ON content_bodies(content_id, version);

CREATE TABLE IF NOT EXISTS content_edits (
    id TEXT PRIMARY KEY,
    content_id TEXT NOT NULL,
    edited_by TEXT NOT NULL,
    actor_type TEXT,
    actor_id TEXT,
    actor_label TEXT,
    actor_metadata TEXT,
    edit_note TEXT,
    previous_version INTEGER NOT NULL,
    new_version INTEGER NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_edits_content ON content_edits(content_id);

CREATE TABLE IF NOT EXISTS schedule_jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT,
    job_type TEXT NOT NULL,
    generator_id TEXT,
    configuration TEXT NOT NULL DEFAULT '{}',
    schedule TEXT NOT NULL,
    cron_expression TEXT,
    schedule_day INTEGER,
    schedule_time TEXT,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    enabled INTEGER NOT NULL DEFAULT 1,
    last_run_at TEXT,
    last_run_status TEXT,
    next_run_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_jobs_enabled ON schedule_jobs(enabled);
CREATE INDEX IF NOT EXISTS idx_jobs_next_run ON schedule_jobs(next_run_at);
CREATE INDEX IF NOT EXISTS idx_jobs_user ON schedule_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_project ON schedule_jobs(project_id);

CREATE TABLE IF NOT EXISTS content_templates (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    content_type TEXT NOT NULL,
    description TEXT,
    is_system INTEGER NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_template_user ON content_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_template_type ON content_templates(content_type);
CREATE INDEX IF NOT EXISTS idx_template_slug ON content_templates(slug);

CREATE TABLE IF NOT EXISTS template_sections (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    field_type TEXT NOT NULL,
    required INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    placeholder TEXT,
    default_prompt TEXT,
    user_prompt TEXT,
    prompt_strategy TEXT NOT NULL DEFAULT 'auto_generate',
    generation_hints TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_section_template ON template_sections(template_id);
CREATE INDEX IF NOT EXISTS idx_section_order ON template_sections(template_id, "order");

CREATE TABLE IF NOT EXISTS idea_pool (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    title TEXT NOT NULL,
    raw_data TEXT NOT NULL DEFAULT '{}',
    seo_signals TEXT,
    trending_signals TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    priority_score REAL,
    status TEXT NOT NULL DEFAULT 'raw',
    project_id TEXT,
    user_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ideas_source ON idea_pool(source);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON idea_pool(status);
CREATE INDEX IF NOT EXISTS idx_ideas_priority ON idea_pool(priority_score);
CREATE INDEX IF NOT EXISTS idx_ideas_project ON idea_pool(project_id);
CREATE INDEX IF NOT EXISTS idx_ideas_user ON idea_pool(user_id);

CREATE TABLE IF NOT EXISTS drip_plans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    cadence_config TEXT NOT NULL DEFAULT '{}',
    cluster_strategy TEXT NOT NULL DEFAULT '{}',
    ssg_config TEXT NOT NULL DEFAULT '{}',
    gsc_config TEXT,
    total_items INTEGER NOT NULL DEFAULT 0,
    started_at TEXT,
    completed_at TEXT,
    last_drip_at TEXT,
    next_drip_at TEXT,
    schedule_job_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_drip_plans_status ON drip_plans(status);
CREATE INDEX IF NOT EXISTS idx_drip_plans_user ON drip_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_drip_plans_project ON drip_plans(project_id);

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

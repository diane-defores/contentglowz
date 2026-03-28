CREATE TABLE IF NOT EXISTS WorkDomain (
    id TEXT PRIMARY KEY NOT NULL,
    userId TEXT NOT NULL,
    projectId TEXT NOT NULL,
    domain TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'idle',
    lastRunAt INTEGER,
    lastRunStatus TEXT,
    itemsPending INTEGER NOT NULL DEFAULT 0,
    itemsCompleted INTEGER NOT NULL DEFAULT 0,
    metadata TEXT,
    updatedAt INTEGER NOT NULL
);

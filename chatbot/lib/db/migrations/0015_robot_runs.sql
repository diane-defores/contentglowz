-- Robot run history — synced from Python via SyncService
-- Robots write to local SQLite; SyncService pushes here every 30s

CREATE TABLE IF NOT EXISTS `RobotRun` (
	`runId` text PRIMARY KEY NOT NULL,
	`robotName` text NOT NULL,
	`workflowType` text NOT NULL,
	`startedAt` text NOT NULL,
	`finishedAt` text,
	`status` text NOT NULL DEFAULT 'running',
	`inputsJson` text,
	`outputsSummaryJson` text,
	`error` text,
	`durationMs` integer,
	`syncedAt` integer
);

CREATE INDEX IF NOT EXISTS `idx_robot_run_name` ON `RobotRun` (`robotName`);
CREATE INDEX IF NOT EXISTS `idx_robot_run_started` ON `RobotRun` (`startedAt`);
CREATE INDEX IF NOT EXISTS `idx_robot_run_status` ON `RobotRun` (`status`);

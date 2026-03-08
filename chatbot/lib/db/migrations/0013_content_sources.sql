CREATE TABLE IF NOT EXISTS `ContentSource` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL REFERENCES `User`(`id`),
	`projectId` text NOT NULL REFERENCES `Project`(`id`),
	`name` text NOT NULL,
	`repoOwner` text NOT NULL,
	`repoName` text NOT NULL,
	`basePath` text NOT NULL,
	`filePattern` text DEFAULT 'both' NOT NULL,
	`templateId` text REFERENCES `ContentTemplate`(`id`),
	`defaultBranch` text DEFAULT 'main' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`lastSyncedAt` integer,
	`metadata` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);

CREATE INDEX IF NOT EXISTS `idx_content_source_user` ON `ContentSource` (`userId`);
CREATE INDEX IF NOT EXISTS `idx_content_source_project` ON `ContentSource` (`projectId`);
CREATE INDEX IF NOT EXISTS `idx_content_source_repo` ON `ContentSource` (`repoOwner`, `repoName`);

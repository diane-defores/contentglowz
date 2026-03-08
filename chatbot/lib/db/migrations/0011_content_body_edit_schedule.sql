CREATE TABLE IF NOT EXISTS `ContentBody` (
	`id` text PRIMARY KEY NOT NULL,
	`contentId` text NOT NULL,
	`body` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`editedBy` text,
	`editNote` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`contentId`) REFERENCES `ContentRecord`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `ContentEdit` (
	`id` text PRIMARY KEY NOT NULL,
	`contentId` text NOT NULL,
	`editedBy` text NOT NULL,
	`editNote` text,
	`previousVersion` integer NOT NULL,
	`newVersion` integer NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`contentId`) REFERENCES `ContentRecord`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `ScheduleJob` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`projectId` text,
	`jobType` text NOT NULL,
	`generatorId` text,
	`configuration` text,
	`schedule` text NOT NULL,
	`cronExpression` text,
	`scheduleDay` integer,
	`scheduleTime` text,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`lastRunAt` integer,
	`lastRunStatus` text,
	`nextRunAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `ContentRecord` ADD `currentVersion` integer DEFAULT 0 NOT NULL;

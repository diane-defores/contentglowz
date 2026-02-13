CREATE TABLE `ContentRecord` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`contentType` text NOT NULL,
	`sourceRobot` text NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`projectId` text,
	`contentPath` text,
	`contentPreview` text,
	`contentHash` text,
	`priority` integer DEFAULT 3 NOT NULL,
	`tags` text,
	`metadata` text,
	`targetUrl` text,
	`reviewerNote` text,
	`reviewedBy` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`scheduledFor` integer,
	`publishedAt` integer,
	`syncedAt` integer
);
--> statement-breakpoint
CREATE TABLE `GmailToken` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`email` text NOT NULL,
	`accessToken` text NOT NULL,
	`refreshToken` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`scope` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `StatusChange` (
	`id` text PRIMARY KEY NOT NULL,
	`contentId` text NOT NULL,
	`fromStatus` text NOT NULL,
	`toStatus` text NOT NULL,
	`changedBy` text NOT NULL,
	`reason` text,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`contentId`) REFERENCES `ContentRecord`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `WorkDomain` (
	`id` text PRIMARY KEY NOT NULL,
	`projectId` text NOT NULL,
	`domain` text NOT NULL,
	`status` text DEFAULT 'idle' NOT NULL,
	`lastRunAt` integer,
	`lastRunStatus` text,
	`itemsPending` integer DEFAULT 0 NOT NULL,
	`itemsCompleted` integer DEFAULT 0 NOT NULL,
	`metadata` text,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `Project` ADD `projectStatus` text DEFAULT 'active' NOT NULL;
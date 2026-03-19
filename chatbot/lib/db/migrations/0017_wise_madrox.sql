CREATE TABLE `ContentAngle` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`projectId` text,
	`personaId` text,
	`title` text NOT NULL,
	`hook` text,
	`angle` text NOT NULL,
	`contentType` text DEFAULT 'article' NOT NULL,
	`narrativeThread` text,
	`painPointAddressed` text,
	`confidence` integer DEFAULT 70,
	`status` text DEFAULT 'suggested' NOT NULL,
	`selectedAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`personaId`) REFERENCES `CustomerPersona`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ContentBody` (
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
CREATE TABLE `ContentEdit` (
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
CREATE TABLE `ContentSource` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`projectId` text NOT NULL,
	`name` text NOT NULL,
	`repoOwner` text NOT NULL,
	`repoName` text NOT NULL,
	`basePath` text NOT NULL,
	`filePattern` text DEFAULT 'all' NOT NULL,
	`templateId` text,
	`defaultBranch` text DEFAULT 'main' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`lastSyncedAt` integer,
	`metadata` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`templateId`) REFERENCES `ContentTemplate`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ContentTemplate` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`projectId` text,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`contentType` text NOT NULL,
	`description` text,
	`isSystem` integer DEFAULT false NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `CreatorEntry` (
	`id` text PRIMARY KEY NOT NULL,
	`profileId` text NOT NULL,
	`chapterId` text,
	`entryType` text DEFAULT 'reflection' NOT NULL,
	`content` text NOT NULL,
	`tags` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`profileId`) REFERENCES `CreatorProfile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`chapterId`) REFERENCES `NarrativeChapter`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `CreatorProfile` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`projectId` text,
	`displayName` text,
	`voice` text,
	`positioning` text,
	`values` text,
	`currentChapterId` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `CustomerPersona` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`projectId` text,
	`name` text NOT NULL,
	`avatar` text,
	`demographics` text,
	`painPoints` text,
	`goals` text,
	`language` text,
	`contentPreferences` text,
	`confidence` integer DEFAULT 50,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `NarrativeChapter` (
	`id` text PRIMARY KEY NOT NULL,
	`profileId` text NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`status` text DEFAULT 'active' NOT NULL,
	`openedAt` integer NOT NULL,
	`closedAt` integer,
	FOREIGN KEY (`profileId`) REFERENCES `CreatorProfile`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `NarrativeUpdate` (
	`id` text PRIMARY KEY NOT NULL,
	`profileId` text NOT NULL,
	`chapterId` text,
	`sourceEntryIds` text,
	`voiceDelta` text,
	`positioningDelta` text,
	`narrativeSummary` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewedAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`profileId`) REFERENCES `CreatorProfile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`chapterId`) REFERENCES `NarrativeChapter`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `RobotRun` (
	`runId` text PRIMARY KEY NOT NULL,
	`robotName` text NOT NULL,
	`workflowType` text NOT NULL,
	`startedAt` text NOT NULL,
	`finishedAt` text,
	`status` text DEFAULT 'running' NOT NULL,
	`inputsJson` text,
	`outputsSummaryJson` text,
	`error` text,
	`durationMs` integer,
	`syncedAt` integer
);
--> statement-breakpoint
CREATE TABLE `ScheduleJob` (
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
CREATE TABLE `TemplateSection` (
	`id` text PRIMARY KEY NOT NULL,
	`templateId` text NOT NULL,
	`name` text NOT NULL,
	`label` text NOT NULL,
	`fieldType` text NOT NULL,
	`required` integer DEFAULT true NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`description` text,
	`placeholder` text,
	`defaultPrompt` text,
	`userPrompt` text,
	`promptStrategy` text DEFAULT 'auto_generate' NOT NULL,
	`generationHints` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`templateId`) REFERENCES `ContentTemplate`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `AffiliateLink` ADD `description` text;--> statement-breakpoint
ALTER TABLE `AffiliateLink` ADD `contactUrl` text;--> statement-breakpoint
ALTER TABLE `AffiliateLink` ADD `loginUrl` text;--> statement-breakpoint
ALTER TABLE `Chat` ADD `type` text DEFAULT 'chat' NOT NULL;--> statement-breakpoint
ALTER TABLE `Chat` ADD `chatStatus` text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `ContentRecord` ADD `currentVersion` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `Project` ADD `posthogProjectId` text;
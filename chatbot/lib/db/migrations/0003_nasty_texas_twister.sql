CREATE TABLE `ActivityLog` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`projectId` text,
	`action` text NOT NULL,
	`robotId` text,
	`status` text DEFAULT 'started' NOT NULL,
	`details` text,
	`createdAt` integer NOT NULL,
	`completedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Project` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`type` text DEFAULT 'github' NOT NULL,
	`description` text,
	`isDefault` integer DEFAULT false NOT NULL,
	`settings` text,
	`lastAnalyzedAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);

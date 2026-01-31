CREATE TABLE `UserSettings` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`theme` text DEFAULT 'system' NOT NULL,
	`language` text DEFAULT 'en',
	`emailNotifications` integer DEFAULT true NOT NULL,
	`webhookUrl` text,
	`apiKeys` text,
	`defaultProjectId` text,
	`dashboardLayout` text,
	`robotSettings` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `UserSettings_userId_unique` ON `UserSettings` (`userId`);
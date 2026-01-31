CREATE TABLE `AffiliateLink` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`category` text,
	`commission` text,
	`keywords` text,
	`status` text DEFAULT 'active' NOT NULL,
	`notes` text,
	`expiresAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Competitor` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`niche` text,
	`priority` text DEFAULT 'medium' NOT NULL,
	`notes` text,
	`lastAnalyzedAt` integer,
	`analysisData` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);

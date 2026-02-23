-- Psychology Engine tables
-- Creator Brain + Customer Brain + The Bridge

CREATE TABLE IF NOT EXISTS `CreatorProfile` (
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
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE INDEX IF NOT EXISTS `idx_creator_profile_user` ON `CreatorProfile` (`userId`);
CREATE INDEX IF NOT EXISTS `idx_creator_profile_project` ON `CreatorProfile` (`projectId`);
CREATE UNIQUE INDEX IF NOT EXISTS `idx_creator_profile_user_project` ON `CreatorProfile` (`userId`, `projectId`);

CREATE TABLE IF NOT EXISTS `NarrativeChapter` (
	`id` text PRIMARY KEY NOT NULL,
	`profileId` text NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`status` text DEFAULT 'active' NOT NULL,
	`openedAt` integer NOT NULL,
	`closedAt` integer,
	FOREIGN KEY (`profileId`) REFERENCES `CreatorProfile`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS `idx_narrative_chapter_profile` ON `NarrativeChapter` (`profileId`);

CREATE TABLE IF NOT EXISTS `CreatorEntry` (
	`id` text PRIMARY KEY NOT NULL,
	`profileId` text NOT NULL,
	`chapterId` text,
	`entryType` text DEFAULT 'reflection' NOT NULL,
	`content` text NOT NULL,
	`tags` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`profileId`) REFERENCES `CreatorProfile`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
	FOREIGN KEY (`chapterId`) REFERENCES `NarrativeChapter`(`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE INDEX IF NOT EXISTS `idx_creator_entry_profile` ON `CreatorEntry` (`profileId`);

CREATE TABLE IF NOT EXISTS `NarrativeUpdate` (
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
	FOREIGN KEY (`profileId`) REFERENCES `CreatorProfile`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
	FOREIGN KEY (`chapterId`) REFERENCES `NarrativeChapter`(`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE INDEX IF NOT EXISTS `idx_narrative_update_profile` ON `NarrativeUpdate` (`profileId`);

CREATE TABLE IF NOT EXISTS `CustomerPersona` (
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
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE INDEX IF NOT EXISTS `idx_customer_persona_user` ON `CustomerPersona` (`userId`);
CREATE INDEX IF NOT EXISTS `idx_customer_persona_project` ON `CustomerPersona` (`projectId`);

CREATE TABLE IF NOT EXISTS `ContentAngle` (
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
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
	FOREIGN KEY (`personaId`) REFERENCES `CustomerPersona`(`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE INDEX IF NOT EXISTS `idx_content_angle_user` ON `ContentAngle` (`userId`);
CREATE INDEX IF NOT EXISTS `idx_content_angle_project` ON `ContentAngle` (`projectId`);
CREATE INDEX IF NOT EXISTS `idx_content_angle_persona` ON `ContentAngle` (`personaId`);

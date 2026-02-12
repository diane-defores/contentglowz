-- Content Templates
CREATE TABLE IF NOT EXISTS `ContentTemplate` (
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

-- Template Sections
CREATE TABLE IF NOT EXISTS `TemplateSection` (
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS `idx_template_user` ON `ContentTemplate`(`userId`);
CREATE INDEX IF NOT EXISTS `idx_template_type` ON `ContentTemplate`(`contentType`);
CREATE INDEX IF NOT EXISTS `idx_template_slug` ON `ContentTemplate`(`slug`);
CREATE INDEX IF NOT EXISTS `idx_section_template` ON `TemplateSection`(`templateId`);
CREATE INDEX IF NOT EXISTS `idx_section_order` ON `TemplateSection`(`templateId`, `order`);

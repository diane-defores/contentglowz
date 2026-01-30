CREATE TABLE `Stream` (
	`id` text PRIMARY KEY NOT NULL,
	`chatId` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`) ON UPDATE no action ON DELETE no action
);

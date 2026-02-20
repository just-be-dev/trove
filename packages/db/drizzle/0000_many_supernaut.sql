CREATE TABLE `resource_author_map` (
	`resource_id` text NOT NULL,
	`author_id` text NOT NULL,
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `resource_authors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `map_resource_id_idx` ON `resource_author_map` (`resource_id`);--> statement-breakpoint
CREATE INDEX `map_author_id_idx` ON `resource_author_map` (`author_id`);--> statement-breakpoint
CREATE TABLE `resource_authors` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`username` text NOT NULL,
	`display_name` text,
	`profile_url` text,
	`resource_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `authors_platform_username_idx` ON `resource_authors` (`platform`,`username`);--> statement-breakpoint
CREATE TABLE `resources` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`title` text,
	`description` text,
	`source` text NOT NULL,
	`source_id` text,
	`author` text,
	`tags` text DEFAULT '[]',
	`notes` text,
	`latitude` real,
	`longitude` real,
	`metadata` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `resources_url_idx` ON `resources` (`url`);--> statement-breakpoint
CREATE INDEX `resources_source_idx` ON `resources` (`source`);--> statement-breakpoint
CREATE INDEX `resources_created_at_idx` ON `resources` (`created_at`);
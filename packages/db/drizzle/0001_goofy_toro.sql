PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_resource_author_map` (
	`resource_id` text NOT NULL,
	`author_id` text NOT NULL,
	PRIMARY KEY(`resource_id`, `author_id`),
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `resource_authors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_resource_author_map`("resource_id", "author_id") SELECT "resource_id", "author_id" FROM `resource_author_map`;--> statement-breakpoint
DROP TABLE `resource_author_map`;--> statement-breakpoint
ALTER TABLE `__new_resource_author_map` RENAME TO `resource_author_map`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `map_resource_id_idx` ON `resource_author_map` (`resource_id`);--> statement-breakpoint
CREATE INDEX `map_author_id_idx` ON `resource_author_map` (`author_id`);
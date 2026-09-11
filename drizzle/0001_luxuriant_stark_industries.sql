PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_records` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`kind` text NOT NULL,
	`year` text NOT NULL,
	`title` text NOT NULL,
	`status` text NOT NULL,
	`due` text DEFAULT '' NOT NULL,
	`assignee` text,
	`parent` text,
	`category` text DEFAULT '' NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`details` text DEFAULT '{}' NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated` text NOT NULL,
	`actor` text NOT NULL,
	FOREIGN KEY (`workspace`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assignee`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parent`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_records`("id", "workspace", "kind", "year", "title", "status", "due", "assignee", "parent", "category", "body", "details", "revision", "updated", "actor") SELECT "id", "workspace", "kind", "year", "title", "status", "due", "assignee", "parent", "category", "body", "details", "revision", "updated", "actor" FROM `records`;--> statement-breakpoint
DROP TABLE `records`;--> statement-breakpoint
ALTER TABLE `__new_records` RENAME TO `records`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `records_workspace_kind` ON `records` (`workspace`,`kind`);--> statement-breakpoint
CREATE INDEX `records_parent` ON `records` (`parent`);
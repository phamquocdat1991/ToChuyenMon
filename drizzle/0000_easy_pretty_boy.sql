CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`record` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`workspace`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`record`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `files_record` ON `files` (`record`);--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`member` text,
	FOREIGN KEY (`workspace`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `membership_email` ON `memberships` (`email`);--> statement-breakpoint
CREATE INDEX `membership_workspace` ON `memberships` (`workspace`);--> statement-breakpoint
CREATE TABLE `records` (
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
	FOREIGN KEY (`workspace`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `records_workspace_kind` ON `records` (`workspace`,`kind`);--> statement-breakpoint
CREATE INDEX `records_parent` ON `records` (`parent`);--> statement-breakpoint
CREATE TABLE `versions` (
	`id` text PRIMARY KEY NOT NULL,
	`record` text NOT NULL,
	`revision` integer NOT NULL,
	`snapshot` text NOT NULL,
	`actor` text NOT NULL,
	`created` text NOT NULL,
	`note` text NOT NULL,
	FOREIGN KEY (`record`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `record_revision` ON `versions` (`record`,`revision`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`year` text NOT NULL,
	`school` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_owner` ON `workspaces` (`owner`);
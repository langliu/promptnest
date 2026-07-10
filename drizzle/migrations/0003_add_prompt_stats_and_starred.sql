ALTER TABLE `prompts` ADD `starred` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `prompts` ADD `copy_count` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `prompts` ADD `last_copied_at` integer;

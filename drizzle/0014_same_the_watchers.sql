ALTER TABLE "todos" ADD COLUMN "tag" varchar(32) DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_tag_valid" CHECK ("todos"."tag" IN ('general', 'client', 'supplier', 'finance', 'project', 'administrative'));
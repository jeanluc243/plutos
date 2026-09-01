CREATE TABLE "todos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" varchar(180) NOT NULL,
	"description" text,
	"priority" varchar(16) DEFAULT 'medium' NOT NULL,
	"due_at" timestamp with time zone,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "todos_title_not_empty" CHECK (length(trim("todos"."title")) > 0),
	CONSTRAINT "todos_priority_valid" CHECK ("todos"."priority" IN ('low', 'medium', 'high'))
);
--> statement-breakpoint
ALTER TABLE "todos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "todos_owner_id_idx" ON "todos" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "todos_owner_completed_idx" ON "todos" USING btree ("owner_id","completed");--> statement-breakpoint
CREATE INDEX "todos_due_at_idx" ON "todos" USING btree ("due_at");--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
		AND EXISTS (
			SELECT 1
			FROM pg_proc
			JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
			WHERE pg_namespace.nspname = 'auth' AND pg_proc.proname = 'uid'
		) THEN
		EXECUTE 'CREATE POLICY "todos_owner_access" ON "todos" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id)';
	END IF;
END
$$;

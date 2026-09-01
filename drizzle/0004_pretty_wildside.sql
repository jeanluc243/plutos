CREATE TABLE "carriers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"information" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "carriers_name_not_empty" CHECK (length(trim("carriers"."name")) > 0)
);
--> statement-breakpoint
ALTER TABLE "carriers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DO $$
BEGIN
	IF to_regclass('auth.users') IS NOT NULL THEN
		ALTER TABLE "carriers"
			ADD CONSTRAINT "carriers_owner_id_auth_users_id_fk"
			FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
	END IF;
END
$$;--> statement-breakpoint
CREATE INDEX "carriers_owner_id_idx" ON "carriers" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "carriers_owner_name_unique" ON "carriers" USING btree ("owner_id","name");--> statement-breakpoint
INSERT INTO "carriers" ("owner_id", "name", "information")
SELECT DISTINCT "owner_id", "carrier", NULL
FROM "orders"
WHERE length(trim("carrier")) > 0
ON CONFLICT ("owner_id", "name") DO NOTHING;--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
		AND EXISTS (
			SELECT 1
			FROM pg_proc
			JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
			WHERE pg_namespace.nspname = 'auth' AND pg_proc.proname = 'uid'
		) THEN
		EXECUTE 'CREATE POLICY "carriers_owner_access" ON "carriers" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id)';
	END IF;
END
$$;--> statement-breakpoint
CREATE TRIGGER "carriers_set_updated_at"
BEFORE UPDATE ON "carriers"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();

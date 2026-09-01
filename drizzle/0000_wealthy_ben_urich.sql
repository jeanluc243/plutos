CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" varchar(32) NOT NULL,
	"has_whatsapp" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clients_name_not_empty" CHECK (length(trim("clients"."name")) > 0),
	CONSTRAINT "clients_phone_not_empty" CHECK (length(trim("clients"."phone")) > 0)
);
--> statement-breakpoint
DO $$
BEGIN
	IF to_regclass('auth.users') IS NOT NULL THEN
		ALTER TABLE "clients"
			ADD CONSTRAINT "clients_owner_id_auth_users_id_fk"
			FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
	END IF;
END
$$;--> statement-breakpoint
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "clients_owner_id_idx" ON "clients" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "clients_owner_phone_unique" ON "clients" USING btree ("owner_id","phone");--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
		AND EXISTS (
			SELECT 1
			FROM pg_proc
			JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
			WHERE pg_namespace.nspname = 'auth' AND pg_proc.proname = 'uid'
		) THEN
		EXECUTE 'CREATE POLICY "clients_owner_access" ON "clients" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id)';
	END IF;
END
$$;--> statement-breakpoint
CREATE OR REPLACE FUNCTION "public"."set_updated_at"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
	NEW.updated_at = now();
	RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER "clients_set_updated_at"
BEFORE UPDATE ON "clients"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();

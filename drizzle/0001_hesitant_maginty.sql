CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"reference" varchar(32) NOT NULL,
	"origin_country_code" varchar(2) NOT NULL,
	"origin_country_name" varchar(80) NOT NULL,
	"origin_city" varchar(120) NOT NULL,
	"destination_country_code" varchar(2) NOT NULL,
	"destination_country_name" varchar(80) NOT NULL,
	"destination_city" varchar(120) NOT NULL,
	"cargo" varchar(180) NOT NULL,
	"carrier" varchar(120) NOT NULL,
	"transport_mode" varchar(24) NOT NULL,
	"total_weight_kg" integer NOT NULL,
	"status" varchar(24) DEFAULT 'in_transit' NOT NULL,
	"progress" integer DEFAULT 10 NOT NULL,
	"eta" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_origin_country_code_length" CHECK (length("orders"."origin_country_code") = 2),
	CONSTRAINT "orders_destination_country_code_length" CHECK (length("orders"."destination_country_code") = 2),
	CONSTRAINT "orders_weight_positive" CHECK ("orders"."total_weight_kg" > 0),
	CONSTRAINT "orders_progress_range" CHECK ("orders"."progress" >= 0 AND "orders"."progress" <= 100)
);
--> statement-breakpoint
DO $$
BEGIN
	IF to_regclass('auth.users') IS NOT NULL THEN
		ALTER TABLE "orders"
			ADD CONSTRAINT "orders_owner_id_auth_users_id_fk"
			FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
	END IF;
END
$$;--> statement-breakpoint
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "orders_owner_id_idx" ON "orders" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_owner_reference_unique" ON "orders" USING btree ("owner_id","reference");--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
		AND EXISTS (
			SELECT 1
			FROM pg_proc
			JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
			WHERE pg_namespace.nspname = 'auth' AND pg_proc.proname = 'uid'
		) THEN
		EXECUTE 'CREATE POLICY "orders_owner_access" ON "orders" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id)';
	END IF;
END
$$;--> statement-breakpoint
CREATE TRIGGER "orders_set_updated_at"
BEFORE UPDATE ON "orders"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();

CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" varchar(180) NOT NULL,
	"category" varchar(120) NOT NULL,
	"supplier" varchar(160) NOT NULL,
	"purchase_price" numeric(12, 2) NOT NULL,
	"sale_price" numeric(12, 2) NOT NULL,
	"city" varchar(120) NOT NULL,
	"country_code" varchar(2) NOT NULL,
	"country_name" varchar(80) NOT NULL,
	"information" text,
	"images" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "articles_name_not_empty" CHECK (length(trim("articles"."name")) > 0),
	CONSTRAINT "articles_category_not_empty" CHECK (length(trim("articles"."category")) > 0),
	CONSTRAINT "articles_supplier_not_empty" CHECK (length(trim("articles"."supplier")) > 0),
	CONSTRAINT "articles_purchase_price_positive" CHECK ("articles"."purchase_price" >= 0),
	CONSTRAINT "articles_sale_price_positive" CHECK ("articles"."sale_price" >= 0),
	CONSTRAINT "articles_country_code_length" CHECK (length("articles"."country_code") = 2)
);
--> statement-breakpoint
DO $$
BEGIN
	IF to_regclass('auth.users') IS NOT NULL THEN
		ALTER TABLE "articles"
			ADD CONSTRAINT "articles_owner_id_auth_users_id_fk"
			FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
	END IF;
END
$$;--> statement-breakpoint
ALTER TABLE "articles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_settings" (
	"owner_id" uuid PRIMARY KEY NOT NULL,
	"exchange_rate" numeric(12, 4) DEFAULT '2800' NOT NULL,
	"display_currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_exchange_rate_positive" CHECK ("user_settings"."exchange_rate" > 0),
	CONSTRAINT "user_settings_display_currency_valid" CHECK ("user_settings"."display_currency" IN ('USD', 'CDF'))
);
--> statement-breakpoint
DO $$
BEGIN
	IF to_regclass('auth.users') IS NOT NULL THEN
		ALTER TABLE "user_settings"
			ADD CONSTRAINT "user_settings_owner_id_auth_users_id_fk"
			FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
	END IF;
END
$$;--> statement-breakpoint
ALTER TABLE "user_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "articles_owner_id_idx" ON "articles" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "articles_category_idx" ON "articles" USING btree ("category");--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
		AND EXISTS (
			SELECT 1
			FROM pg_proc
			JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
			WHERE pg_namespace.nspname = 'auth' AND pg_proc.proname = 'uid'
		) THEN
		EXECUTE 'CREATE POLICY "articles_owner_access" ON "articles" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id)';
	END IF;
END
$$;--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
		AND EXISTS (
			SELECT 1
			FROM pg_proc
			JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
			WHERE pg_namespace.nspname = 'auth' AND pg_proc.proname = 'uid'
		) THEN
		EXECUTE 'CREATE POLICY "user_settings_owner_access" ON "user_settings" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id)';
	END IF;
END
$$;--> statement-breakpoint
CREATE TRIGGER "articles_set_updated_at"
BEFORE UPDATE ON "articles"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "user_settings_set_updated_at"
BEFORE UPDATE ON "user_settings"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();

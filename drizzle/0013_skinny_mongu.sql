CREATE TABLE "origin_cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"country_code" varchar(2) NOT NULL,
	"name" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "origin_cities_country_code_length" CHECK (length("origin_cities"."country_code") = 2),
	CONSTRAINT "origin_cities_name_not_empty" CHECK (length(trim("origin_cities"."name")) > 0)
);
--> statement-breakpoint
ALTER TABLE "origin_cities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "origin_cities_owner_country_idx" ON "origin_cities" USING btree ("owner_id","country_code");--> statement-breakpoint
CREATE UNIQUE INDEX "origin_cities_owner_country_name_unique" ON "origin_cities" USING btree ("owner_id","country_code","name");--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
    AND EXISTS (
      SELECT 1
      FROM pg_proc
      JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
      WHERE pg_namespace.nspname = 'auth' AND pg_proc.proname = 'uid'
    ) THEN
    CREATE POLICY "origin_cities_owner_access" ON "origin_cities" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "origin_cities"."owner_id") WITH CHECK (auth.uid() = "origin_cities"."owner_id");
  END IF;
END $$;

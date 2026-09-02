CREATE TABLE "article_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "article_categories_name_not_empty" CHECK (length(trim("article_categories"."name")) > 0)
);
--> statement-breakpoint
ALTER TABLE "article_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "article_categories_owner_id_idx" ON "article_categories" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "article_categories_owner_name_unique" ON "article_categories" USING btree ("owner_id","name");--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
    AND EXISTS (
      SELECT 1
      FROM pg_proc
      JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
      WHERE pg_namespace.nspname = 'auth' AND pg_proc.proname = 'uid'
    ) THEN
    CREATE POLICY "article_categories_owner_access" ON "article_categories" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "article_categories"."owner_id") WITH CHECK (auth.uid() = "article_categories"."owner_id");
    CREATE POLICY "article_categories_admin_read" ON "article_categories" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_admin());
  END IF;
END $$;

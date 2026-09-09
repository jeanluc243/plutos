CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"article_id" uuid NOT NULL,
	"movement_type" varchar(16) NOT NULL,
	"quantity_change" integer NOT NULL,
	"stock_before" integer NOT NULL,
	"stock_after" integer NOT NULL,
	"reason" varchar(240),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_movements_type_valid" CHECK ("stock_movements"."movement_type" IN ('entry', 'exit', 'sale')),
	CONSTRAINT "stock_movements_quantity_non_zero" CHECK ("stock_movements"."quantity_change" <> 0),
	CONSTRAINT "stock_movements_before_positive" CHECK ("stock_movements"."stock_before" >= 0),
	CONSTRAINT "stock_movements_after_positive" CHECK ("stock_movements"."stock_after" >= 0)
);
--> statement-breakpoint
ALTER TABLE "stock_movements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "stock_movements_owner_id_idx" ON "stock_movements" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "stock_movements_article_id_idx" ON "stock_movements" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements" USING btree ("created_at");--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
    AND EXISTS (
      SELECT 1
      FROM pg_proc
      JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
      WHERE pg_namespace.nspname = 'auth' AND pg_proc.proname = 'uid'
    ) THEN
    CREATE POLICY "stock_movements_owner_access" ON "stock_movements" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "stock_movements"."owner_id") WITH CHECK (auth.uid() = "stock_movements"."owner_id");
    CREATE POLICY "stock_movements_admin_read" ON "stock_movements" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_admin());
  END IF;
END $$;

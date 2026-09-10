CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"article_id" uuid,
	"description" varchar(180) NOT NULL,
	"sku" varchar(64) NOT NULL,
	"quantity" integer NOT NULL,
	"purchase_unit_price" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_items_quantity_positive" CHECK ("order_items"."quantity" > 0),
	CONSTRAINT "order_items_purchase_price_positive" CHECK ("order_items"."purchase_unit_price" >= 0)
);
--> statement-breakpoint
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
INSERT INTO "order_items" (
	"order_id",
	"owner_id",
	"article_id",
	"description",
	"sku",
	"quantity",
	"purchase_unit_price",
	"created_at"
)
SELECT
	"orders"."id",
	"orders"."owner_id",
	"orders"."article_id",
	"orders"."cargo",
	COALESCE("articles"."sku", "orders"."reference"),
	"orders"."quantity",
	"orders"."purchase_unit_price",
	"orders"."created_at"
FROM "orders"
LEFT JOIN "articles" ON "articles"."id" = "orders"."article_id"
ON CONFLICT DO NOTHING;--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_owner_id_idx" ON "order_items" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "order_items_article_id_idx" ON "order_items" USING btree ("article_id");--> statement-breakpoint
CREATE UNIQUE INDEX "order_items_order_article_unique" ON "order_items" USING btree ("order_id","article_id");--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
    AND EXISTS (
      SELECT 1
      FROM pg_proc
      JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
      WHERE pg_namespace.nspname = 'auth' AND pg_proc.proname = 'uid'
    ) THEN
    CREATE POLICY "order_items_owner_access" ON "order_items" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "order_items"."owner_id") WITH CHECK (auth.uid() = "order_items"."owner_id");
    CREATE POLICY "order_items_admin_read" ON "order_items" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_admin());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "todos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" uuid NOT NULL,
  "title" varchar(180) NOT NULL,
  "description" text,
  "priority" varchar(16) DEFAULT 'medium' NOT NULL,
  "tag" varchar(32) DEFAULT 'general' NOT NULL,
  "image" text,
  "due_at" timestamp with time zone,
  "completed" boolean DEFAULT false NOT NULL,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "todos_title_not_empty" CHECK (length(trim("title")) > 0),
  CONSTRAINT "todos_priority_valid" CHECK ("priority" IN ('low', 'medium', 'high')),
  CONSTRAINT "todos_tag_valid" CHECK ("tag" IN ('general', 'client', 'supplier', 'finance', 'project', 'administrative'))
);--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN IF NOT EXISTS "tag" varchar(32) DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN IF NOT EXISTS "image" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "todos_owner_id_idx" ON "todos" ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "todos_owner_completed_idx" ON "todos" ("owner_id", "completed");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "todos_due_at_idx" ON "todos" ("due_at");--> statement-breakpoint
ALTER TABLE "todos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "stock_movements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" uuid NOT NULL,
  "article_id" uuid NOT NULL,
  "movement_type" varchar(16) NOT NULL,
  "quantity_change" integer NOT NULL,
  "stock_before" integer NOT NULL,
  "stock_after" integer NOT NULL,
  "reason" varchar(240),
  "created_by_email" varchar(320),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "stock_movements_type_valid" CHECK ("movement_type" IN ('entry', 'exit', 'sale')),
  CONSTRAINT "stock_movements_quantity_non_zero" CHECK ("quantity_change" <> 0),
  CONSTRAINT "stock_movements_before_positive" CHECK ("stock_before" >= 0),
  CONSTRAINT "stock_movements_after_positive" CHECK ("stock_after" >= 0)
);--> statement-breakpoint
ALTER TABLE "stock_movements" ADD COLUMN IF NOT EXISTS "created_by_email" varchar(320);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_movements_owner_id_idx" ON "stock_movements" ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_movements_article_id_idx" ON "stock_movements" ("article_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_movements_created_at_idx" ON "stock_movements" ("created_at");--> statement-breakpoint
ALTER TABLE "stock_movements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "client_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "quantity" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "purchase_unit_price" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "created_by_email" varchar(320);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "transport_cost" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "additional_charges" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "launched_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "launched_by_email" varchar(320);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_client_id_idx" ON "orders" ("client_id");--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_client_id_clients_id_fk') THEN
    ALTER TABLE "orders" ADD CONSTRAINT "orders_client_id_clients_id_fk"
      FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_quantity_positive') THEN
    ALTER TABLE "orders" ADD CONSTRAINT "orders_quantity_positive" CHECK ("quantity" > 0);
  END IF;
END $$;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "order_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL REFERENCES "public"."orders"("id") ON DELETE CASCADE,
  "owner_id" uuid NOT NULL,
  "article_id" uuid REFERENCES "public"."articles"("id") ON DELETE SET NULL,
  "description" varchar(180) NOT NULL,
  "sku" varchar(64) NOT NULL,
  "quantity" integer NOT NULL,
  "purchase_unit_price" numeric(12, 2) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "order_items_quantity_positive" CHECK ("quantity" > 0),
  CONSTRAINT "order_items_purchase_price_positive" CHECK ("purchase_unit_price" >= 0)
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_items_order_id_idx" ON "order_items" ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_items_owner_id_idx" ON "order_items" ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_items_article_id_idx" ON "order_items" ("article_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "order_items_order_article_unique" ON "order_items" ("order_id", "article_id");--> statement-breakpoint
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

INSERT INTO "order_items" (
  "order_id", "owner_id", "article_id", "description", "sku",
  "quantity", "purchase_unit_price", "created_at"
)
SELECT
  "orders"."id", "orders"."owner_id", "orders"."article_id", "orders"."cargo",
  COALESCE("articles"."sku", "orders"."reference"), "orders"."quantity",
  "orders"."purchase_unit_price", "orders"."created_at"
FROM "orders"
LEFT JOIN "articles" ON "articles"."id" = "orders"."article_id"
ON CONFLICT DO NOTHING;--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
    AND EXISTS (
      SELECT 1 FROM pg_proc
      JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
      WHERE pg_namespace.nspname = 'auth' AND pg_proc.proname = 'uid'
    ) THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'todos' AND policyname = 'todos_owner_access') THEN
      CREATE POLICY "todos_owner_access" ON "todos" FOR ALL TO "authenticated"
        USING (auth.uid() = "owner_id") WITH CHECK (auth.uid() = "owner_id");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stock_movements' AND policyname = 'stock_movements_owner_access') THEN
      CREATE POLICY "stock_movements_owner_access" ON "stock_movements" FOR ALL TO "authenticated"
        USING (auth.uid() = "owner_id") WITH CHECK (auth.uid() = "owner_id");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'order_items' AND policyname = 'order_items_owner_access') THEN
      CREATE POLICY "order_items_owner_access" ON "order_items" FOR ALL TO "authenticated"
        USING (auth.uid() = "owner_id") WITH CHECK (auth.uid() = "owner_id");
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace WHERE pg_namespace.nspname = 'public' AND pg_proc.proname = 'is_admin') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'todos' AND policyname = 'todos_admin_read') THEN
        CREATE POLICY "todos_admin_read" ON "todos" FOR SELECT TO "authenticated" USING (public.is_admin());
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stock_movements' AND policyname = 'stock_movements_admin_read') THEN
        CREATE POLICY "stock_movements_admin_read" ON "stock_movements" FOR SELECT TO "authenticated" USING (public.is_admin());
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'order_items' AND policyname = 'order_items_admin_read') THEN
        CREATE POLICY "order_items_admin_read" ON "order_items" FOR SELECT TO "authenticated" USING (public.is_admin());
      END IF;
    END IF;
  END IF;
END $$;

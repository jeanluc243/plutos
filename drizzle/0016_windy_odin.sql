ALTER TABLE "orders" ADD COLUMN "quantity" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "purchase_unit_price" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "created_by_email" varchar(320);--> statement-breakpoint
ALTER TABLE "stock_movements" ADD COLUMN "created_by_email" varchar(320);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_quantity_positive" CHECK ("orders"."quantity" > 0);
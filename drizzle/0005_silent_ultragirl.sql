ALTER TABLE "orders" ALTER COLUMN "total_weight_kg" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cbm" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_cbm_positive" CHECK ("orders"."cbm" > 0);
ALTER TABLE "articles" ADD COLUMN "sku" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "rating" numeric(2, 1) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "review_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "stock" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "articles_owner_sku_unique" ON "articles" USING btree ("owner_id","sku");--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_sku_not_empty" CHECK (length(trim("articles"."sku")) > 0);--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_rating_range" CHECK ("articles"."rating" >= 0 AND "articles"."rating" <= 5);--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_review_count_positive" CHECK ("articles"."review_count" >= 0);--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_stock_positive" CHECK ("articles"."stock" >= 0);
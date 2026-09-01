ALTER TABLE "orders" ADD COLUMN "article_id" uuid;--> statement-breakpoint
CREATE INDEX "orders_article_id_idx" ON "orders" USING btree ("article_id");
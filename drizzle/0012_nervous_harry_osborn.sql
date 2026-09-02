ALTER TABLE "articles" ADD COLUMN "payment_commission" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "china_transport_cost" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "agency_transport_cost" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "gain_multiplier" numeric(4, 2) DEFAULT '1.5' NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_payment_commission_positive" CHECK ("articles"."payment_commission" >= 0);--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_china_transport_cost_positive" CHECK ("articles"."china_transport_cost" >= 0);--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_agency_transport_cost_positive" CHECK ("articles"."agency_transport_cost" >= 0);--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_gain_multiplier_range" CHECK ("articles"."gain_multiplier" >= 1.5 AND "articles"."gain_multiplier" <= 10);
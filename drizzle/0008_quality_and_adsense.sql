ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "content_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN IF NOT EXISTS "last_fetched_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "adsense_publisher_id" varchar(64);

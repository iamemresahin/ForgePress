ALTER TABLE "sites" ADD COLUMN "featured_nav_label" varchar(120);
--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "all_nav_label" varchar(120);
--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "nav_topic_slugs" jsonb DEFAULT '[]'::jsonb NOT NULL;

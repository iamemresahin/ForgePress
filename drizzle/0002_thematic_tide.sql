DO $$ BEGIN
 CREATE TYPE "public"."site_theme_preset" AS ENUM('forge_blue', 'editorial_glow', 'news_sand', 'midnight_signal');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."site_homepage_layout" AS ENUM('spotlight', 'digest');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."site_article_layout" AS ENUM('editorial', 'feature');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "theme_preset" "site_theme_preset" DEFAULT 'forge_blue' NOT NULL;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "homepage_layout" "site_homepage_layout" DEFAULT 'spotlight' NOT NULL;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "article_layout" "site_article_layout" DEFAULT 'editorial' NOT NULL;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "theme_primary" varchar(16);--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "theme_accent" varchar(16);--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "theme_background" varchar(16);

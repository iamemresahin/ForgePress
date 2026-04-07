-- Add unique constraint on article_localizations (article_id, locale)
ALTER TABLE "article_localizations" ADD CONSTRAINT "article_localizations_article_id_locale_unique" UNIQUE ("article_id","locale");

-- Add updated_at to jobs table
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT now();

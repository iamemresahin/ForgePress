-- platform settings store (autopilot flag, etc.)
CREATE TABLE IF NOT EXISTS "platform_settings" (
  "key" varchar(80) PRIMARY KEY,
  "value" jsonb NOT NULL,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- jobs need updated_at for worker bookkeeping
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT now();

-- per-site Google Analytics tag
ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "gtag_id" varchar(32);

-- unique constraint so localization upserts (ON CONFLICT) work correctly
ALTER TABLE "article_localizations"
  DROP CONSTRAINT IF EXISTS "article_localizations_article_id_locale_unique",
  ADD CONSTRAINT "article_localizations_article_id_locale_unique" UNIQUE ("article_id", "locale");

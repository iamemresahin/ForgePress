-- Ensure each article has at most one localization per locale
CREATE UNIQUE INDEX IF NOT EXISTS "article_localizations_article_id_locale_unique"
  ON "article_localizations" ("article_id", "locale");

ALTER TABLE "sites" ADD COLUMN "topic_label_overrides" jsonb DEFAULT '{}'::jsonb NOT NULL;

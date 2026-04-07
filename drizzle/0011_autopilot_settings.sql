CREATE TABLE IF NOT EXISTS "platform_settings" (
  "key" varchar(120) PRIMARY KEY,
  "value" jsonb NOT NULL DEFAULT 'false',
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

INSERT INTO "platform_settings" ("key", "value")
VALUES ('autopilot', 'false')
ON CONFLICT ("key") DO NOTHING;

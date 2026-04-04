ALTER TABLE "sites" ADD COLUMN "editorial_guidelines" text;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "adsense_policy_notes" text;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "prohibited_topics" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "required_sections" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "review_checklist" jsonb DEFAULT '[]'::jsonb NOT NULL;
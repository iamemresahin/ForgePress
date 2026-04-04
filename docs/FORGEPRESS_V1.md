# ForgePress V1

## Product definition

ForgePress is a platform for running multiple automated publishing sites from one system.

Each site can:

- target a different niche
- publish in one or more languages
- run its own source feeds, prompts, categories, and ad layout rules
- be reviewed and controlled from one admin plane

ForgePress itself is the operating system behind those sites, not the public-facing publication brand.

## V1 scope

V1 should support:

- multi-site management
- source ingestion and normalization
- AI-assisted rewrite workflow
- manual editor review and override
- image generation or editorial selection
- SEO-ready article publishing
- sitemap and feed generation
- AdSense slot management
- recurring jobs with logs and retries

V1 should not try to solve:

- social automation across every network
- advanced BI and revenue forecasting
- custom advertiser integrations
- full newsroom collaboration tooling

## User roles

### Platform admin

- creates and configures sites
- manages billing, prompts, limits, and global defaults
- views all job runs and failures

### Site editor

- reviews drafts
- edits titles, body, metadata, categories, and images
- schedules or publishes articles
- manages sources for a specific site

### Reviewer

- approves, rejects, or flags content
- handles risky or sensitive content

## Product modules

## 1. Site management

- create new site
- assign domain
- set default locale
- define supported locales
- define categories and tags
- set tone and content policy
- define ad slot strategy

## 2. Source ingestion

- RSS feeds
- sitemap crawling
- approved source lists
- manual URL submission
- duplicate detection
- source health tracking

## 3. Editorial pipeline

- raw article capture
- normalization
- deduplication
- rewrite
- localization
- SEO metadata generation
- image generation or selection
- moderation and risk checks
- review queue

## 4. Publishing engine

- article pages
- category pages
- author/editorial pages if needed
- sitemap index
- locale sitemaps
- RSS feed
- schema.org metadata
- hreflang support

## 5. Admin panel

- dashboard
- site settings
- sources
- queue
- article editor
- media
- prompts
- ads
- jobs
- audit history

## 6. Jobs and automation

- scheduled ingestion
- rewrite jobs
- image jobs
- localization jobs
- publish jobs
- reindex and sitemap refresh jobs
- retryable failures

## Architecture direction

## Frontend

- public renderer for sites
- admin application for internal operations
- shared design system

## Backend

- API service for admin and publishing control
- worker service for async jobs
- scheduler for recurring workflows

## Data layer

- PostgreSQL as source of truth
- Redis for queue and rate-limited work
- object storage for media

## AI layer

- OpenAI text models for rewrite, localization, title generation, summaries, and metadata
- OpenAI image generation for article visuals where appropriate
- moderation checks before publish for risky content

## Suggested tech stack

- frontend/public/admin: Next.js
- ORM: Drizzle
- database: PostgreSQL
- jobs: BullMQ with Valkey
- auth: first-party admin auth
- storage: local persistent volume first, S3-compatible object storage later if needed
- CDN and DNS: Cloudflare

## Coolify-first deployment choice

ForgePress should be built to run comfortably on Coolify with the fewest moving parts possible.

Recommended production layout:

- one Coolify application for the Next.js app
- one Coolify PostgreSQL service
- one Coolify Valkey service
- one persistent volume for local media in V1, or object storage later when scale requires it

This keeps the stack inexpensive and operationally simple while still supporting:

- scheduled jobs
- admin access
- public publishing
- queue-based automation

## Database choice

Preferred database for V1: self-hosted PostgreSQL on Coolify.

Reason:

- effectively free beyond the server you already pay for
- much safer than trying to force SQLite into a multi-site publishing system
- good fit for jobs, editorial state, locales, and admin activity
- easy to back up and migrate later

We should not use SQLite as the main production database for ForgePress because:

- concurrent writes from jobs and admin flows will become painful
- queue and review workflows are better served by PostgreSQL
- multi-tenant publishing metadata will outgrow the SQLite comfort zone quickly

## Queue choice

Preferred queue for V1: Valkey on Coolify.

Reason:

- Redis-compatible
- easy BullMQ support
- low operational friction on Coolify
- works well for ingestion, rewrite, publish, and retry flows

## Content workflow

1. Source item enters ingestion queue.
2. System stores raw snapshot and metadata.
3. Duplicate and near-duplicate checks run.
4. Rewrite brief is generated per site and locale.
5. LLM produces draft title, body, slug, meta description, and taxonomy suggestions.
6. Image workflow chooses generated, curated, or uploaded visual.
7. Risk checks flag questionable outputs.
8. Article enters review queue.
9. Editor reviews, edits, approves, schedules, or rejects.
10. Publish job writes public output and refreshes SEO surfaces.

## AdSense model

AdSense is the primary revenue model, so V1 needs:

- configurable ad slots per site
- reserved slot dimensions to reduce layout shift
- article templates with controlled ad density
- category and archive templates with in-feed slots
- desktop and mobile strategies kept separate
- policy-safe, non-deceptive placement

## Quality guardrails

- no blind auto-publish by default
- source attribution stored for each article
- risky categories receive mandatory review
- generated visuals should avoid copyright and trademark issues
- duplicate and thin-content detection must block publication

## Data model outline

- `sites`
- `site_locales`
- `site_domains`
- `site_categories`
- `site_tags`
- `sources`
- `source_runs`
- `raw_articles`
- `article_candidates`
- `articles`
- `article_localizations`
- `article_versions`
- `article_images`
- `review_tasks`
- `prompts`
- `jobs`
- `job_attempts`
- `ad_slots`
- `audit_events`

## V1 success criteria

- one operator can run multiple sites from one admin
- each site can publish multilingual content
- the queue can process source items reliably
- editors can intervene at every important step
- public pages are indexable and ad-ready
- failures are visible and retryable

# ForgePress

ForgePress is a multi-site publishing engine for operating AI-assisted content sites from one control plane.

The product direction is not a marketing landing page or a generic editorial CMS. ForgePress is being built to:

- run many sites from one platform
- ingest source material on a schedule
- rewrite and localize content with LLMs
- generate or curate supporting visuals
- publish SEO-ready pages with sitemap and indexing support
- monetize primarily through Google AdSense
- allow strong human editorial control through an admin panel

## Core product goals

- multi-tenant site management
- multi-language publishing
- automated content pipeline with human override
- AdSense-aware page layouts and slot management
- SEO-first article, category, and archive publishing
- durable job orchestration for recurring runs

## Planned product surfaces

- public site renderer
- admin panel
- content queue and review
- source management
- prompt and workflow controls
- site settings and monetization controls
- job runs and failure diagnostics

## Planned architecture

- frontend: React app shell during early prototyping, then platform UI for public and admin surfaces
- backend: dedicated API and worker services
- database: PostgreSQL
- queue: Redis-backed job processing
- storage: object storage for generated and uploaded media
- AI: OpenAI for rewrite, localization, SEO metadata, moderation, and image generation

## Current repo state

The current UI is an early visual starter only. It does not represent the final ForgePress product structure.

Before feature work begins, the repo should be reshaped around the architecture and delivery plan documented in:

- [docs/FORGEPRESS_V1.md](./docs/FORGEPRESS_V1.md)
- [docs/IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md)
- [docs/CODEX_WORKFLOW.md](./docs/CODEX_WORKFLOW.md)

## Working principles

- start from platform architecture, not page polish
- build multi-site support into the data model from day one
- keep automation reviewable and interruptible by editors
- optimize for sustainable AdSense monetization, not ad spam
- prefer predictable, observable jobs over hidden background magic

## Skills installed for this project

- `doc`
- `playwright-interactive`
- `imagegen`
- `cloudflare-deploy`
- `openai-docs`
- `gh-address-comments`
- `gh-fix-ci`
- `yeet`

Restart Codex to pick up new skills.

# ForgePress Implementation Plan

## Phase 1: Reset the starter

- remove product-marketing assumptions from the current UI
- establish app structure for public, admin, and shared modules
- replace placeholder copy with product scaffolding
- set up environment contract

## Phase 2: Foundation

- choose final stack around Next.js plus PostgreSQL plus Valkey
- add database schema tooling
- create environment validation
- add auth and roles
- define tenant and site model

## Phase 3: Admin core

- admin shell
- dashboard
- site switcher
- sources screen
- queue screen
- article editor shell
- jobs screen

## Phase 4: Automation core

- ingestion jobs
- duplicate checks
- rewrite jobs
- localization jobs
- image jobs
- moderation jobs
- publish jobs

## Phase 5: Public publishing

- article template
- category template
- archive template
- sitemap generation
- feed generation
- schema and hreflang

## Phase 6: Monetization and hardening

- ad slot system
- slot preview and placement controls
- run logs
- failure recovery
- cost tracking
- content quality rules

## Proposed repo direction

The current repo should evolve toward:

```text
src/
  app/
    admin/
    public/
    api/
  components/
    admin/
    public/
    shared/
  modules/
    sites/
    sources/
    articles/
    jobs/
    ads/
    auth/
    ai/
  lib/
    db/
    queue/
    storage/
    seo/
    env/
  workers/
```

## Immediate next coding tasks

1. Replace the current Vite starter with a Coolify-friendly Next.js application.
2. Add environment validation for app, PostgreSQL, Valkey, OpenAI, and Cloudflare settings.
3. Create the initial schema for sites, sources, articles, and jobs.
4. Build the first admin shell instead of continuing the marketing page.
5. Wire a first manual article creation flow before automating ingestion.

## Infrastructure baseline

V1 infrastructure should assume:

- deployment target: Coolify
- app runtime: one Next.js application service
- primary database: Coolify PostgreSQL service
- queue backend: Coolify Valkey service
- media storage: local persistent volume first

This is the cheapest practical setup that still fits the product.

## Explicit stack decision

- app framework: Next.js
- ORM: Drizzle
- database: PostgreSQL on Coolify
- queue: BullMQ backed by Valkey on Coolify
- auth: admin-only email/password in V1
- storage: filesystem-backed media on a mounted volume in V1

## Why this setup

- easy to deploy on one Coolify-managed server
- avoids paid database dependencies in early stages
- keeps background jobs viable
- supports later migration to S3-compatible storage without changing the core product model

## Delivery rules

- every automation path must be observable
- every publishable item must be editable
- no hidden content generation without logs
- multi-site support must be first-class, not added later
- SEO and ads must be controlled by configuration, not hardcoded templates

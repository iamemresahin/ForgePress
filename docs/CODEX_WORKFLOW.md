# ForgePress Codex Workflow

This document defines the recommended Codex skill workflow for ForgePress.

## Why this exists

ForgePress is not a single-surface marketing site. It is a multi-site publishing platform with:

- Next.js application work
- PostgreSQL and Drizzle data modeling
- BullMQ and Valkey job orchestration
- OpenAI-driven rewrite and localization workflows
- Coolify deployment
- Cloudflare DNS and edge work
- GitHub-based collaboration and CI follow-up

That means the best workflow is a small, opinionated set of skills instead of a large generic toolbox.

## Core skill stack

### Product and UI

- `frontend-skill`
  Use when building the public renderer, admin UX, or any screen that needs deliberate hierarchy and strong visual direction.

- `playwright`
  Use for browser automation, route verification, smoke tests, and UI debugging.

- `playwright-interactive`
  Use when we need a persistent browser session during iterative UI work.

- `imagegen`
  Use for editorial visual generation, mock content art, or image experiments that support the publishing workflow.

### Platform and infra

- `coolify`
  Use for deployment, runtime inspection, service management, and build-log debugging in Coolify.

- `cloudflare-deploy`
  Use when deploying or configuring Cloudflare-hosted assets and platform resources.

- `publish`
  Use when shipping ForgePress end-to-end through Coolify plus Cloudflare together.

### OpenAI and research

- `openai-docs`
  Use for all OpenAI API, model, Responses API, image, moderation, and prompt guidance questions.
  Prefer official OpenAI docs over memory.

### GitHub workflow

- `gh-address-comments`
  Use when a PR has actionable review feedback to apply.

- `gh-fix-ci`
  Use when a PR has failing GitHub Actions checks.

- `yeet`
  Use only when we explicitly want to stage, commit, push, and open a PR in one flow.

### Security and quality

- `security-best-practices`
  Use for explicit security reviews, auth hardening, tenant isolation checks, and secure-by-default implementation guidance.

## Required local prerequisites

### GitHub

- `gh` CLI must be installed.
- `gh auth login` must be completed before using `gh-address-comments`, `gh-fix-ci`, or `yeet`.

Recommended check:

```bash
gh auth status
```

### Coolify

Expected local config:

```bash
~/.config/codex-integrations/coolify.env
```

### Cloudflare

Expected local config:

```bash
~/.config/codex-integrations/cloudflare.env
```

## ForgePress workflow by stage

### Stage 1: Foundation and admin core

Default skills:

- `frontend-skill`
- `playwright`
- `openai-docs`

Focus:

- admin shell evolution
- app structure
- form flows
- route and layout validation

### Stage 2: Data model and automation

Default skills:

- `openai-docs`
- `security-best-practices`
- `playwright`

Focus:

- schema changes
- article and source workflows
- queue-backed jobs
- OpenAI integration contracts
- auth and role safety

### Stage 3: Collaboration and delivery

Default skills:

- `gh-address-comments`
- `gh-fix-ci`
- `yeet`
- `publish`

Focus:

- review handling
- CI failure repair
- disciplined PR creation
- deployment and domain work

## Recommended operating sequence

For most feature work in ForgePress:

1. Inspect the relevant module and current docs.
2. Implement the smallest end-to-end slice.
3. Validate locally with `npm run build` and targeted browser checks.
4. If OpenAI integration or model choice is involved, verify with `openai-docs`.
5. If the work touches auth, admin permissions, secrets, tenant boundaries, or public content generation, run a security pass.
6. When review feedback appears, use `gh-address-comments`.
7. When CI fails, use `gh-fix-ci`.
8. When the branch is ready, use `yeet`.
9. When the user wants to ship, use `publish`.

## Current recommended next implementation order

This is the practical build sequence from the current repo state:

1. Add first-party admin auth and roles.
2. Build site creation and site listing flows backed by the database.
3. Build manual article creation and editing flow.
4. Add source management CRUD.
5. Add jobs table views and queue-trigger actions.
6. Wire the first OpenAI-assisted draft generation path.
7. Add publish pipeline and public article pages.
8. Add deployment and operational checks for Coolify.

## Notes

- Prefer a tight skill set. Do not install extra skills unless they clearly reduce repeated work.
- For ForgePress, official OpenAI and official GitHub-oriented skills are higher trust than random third-party skill repos.
- If we later add Sentry, Notion, or Linear to the real team workflow, we can install those skills then.

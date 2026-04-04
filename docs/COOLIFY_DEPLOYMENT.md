# Coolify deployment

## Recommended services

- `forgepress-app`
- `forgepress-postgres`
- `forgepress-valkey`

## App type

Use the repository as a Dockerfile-based application in Coolify.

## Required environment variables

- `NODE_ENV=production`
- `APP_URL=https://your-domain`
- `DATABASE_URL=postgres://...`
- `QUEUE_URL=redis://...`
- `OPENAI_API_KEY=...`
- `OPENAI_TEXT_MODEL=gpt-5.4-mini`
- `OPENAI_MODERATION_MODEL=omni-moderation-latest`
- `FORGEPRESS_ADMIN_EMAIL=...`
- `FORGEPRESS_ADMIN_PASSWORD=...`
- `FORGEPRESS_SESSION_SECRET=...`

Optional:

- `CLOUDFLARE_API_TOKEN=...`
- `CLOUDFLARE_ZONE_ID=...`

## Notes

- Exposed app port: `3000`
- Health endpoint: `/api/health`
- Readiness endpoint: `/api/ops/readiness`
- Bootstrap contract endpoint: `/api/bootstrap`
- Persistent media volume can be mounted later when the media pipeline is added

## Recommended Coolify health check

- path: `/api/ops/readiness`
- expected status: `200`
- use `/api/health` only for a lightweight liveness check

## Runtime verification

After deployment, verify:

- `/api/health`
- `/api/bootstrap`
- `/api/ops/readiness`
- `/login`
- one published site route such as `/{siteSlug}/{articleSlug}`

## V1 deployment shape

For the first shipping version:

- keep PostgreSQL and Valkey as Coolify-managed services
- run the Next.js app as the public and admin surface
- add a dedicated worker process later if queue throughput grows beyond the app process

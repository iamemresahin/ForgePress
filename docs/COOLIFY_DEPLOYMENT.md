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
- `FORGEPRESS_ADMIN_EMAIL=...`
- `FORGEPRESS_ADMIN_PASSWORD=...`

Optional:

- `CLOUDFLARE_API_TOKEN=...`
- `CLOUDFLARE_ZONE_ID=...`

## Notes

- Exposed app port: `3000`
- Health endpoint: `/api/health`
- Bootstrap contract endpoint: `/api/bootstrap`
- Persistent media volume can be mounted later when the media pipeline is added

## V1 deployment shape

For the first shipping version:

- keep PostgreSQL and Valkey as Coolify-managed services
- run the Next.js app as the public and admin surface
- add a dedicated worker process later if queue throughput grows beyond the app process

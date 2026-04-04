import { sql } from 'drizzle-orm'

import { db, pool } from '@/lib/db'
import { articles, jobs, sites } from '@/lib/db/schema'
import { env } from '@/lib/env'
import { redis } from '@/lib/queue'

async function checkDatabase() {
  try {
    await pool.query('select 1')
    return { ok: true as const }
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : 'Database check failed.',
    }
  }
}

async function checkQueue() {
  try {
    const result = await redis.ping()
    return { ok: result === 'PONG' }
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : 'Queue check failed.',
    }
  }
}

async function getCounts() {
  const [siteCount] = await db.select({ value: sql<number>`count(*)::int` }).from(sites)
  const [articleCount] = await db.select({ value: sql<number>`count(*)::int` }).from(articles)
  const [jobCount] = await db.select({ value: sql<number>`count(*)::int` }).from(jobs)

  return {
    sites: siteCount?.value ?? 0,
    articles: articleCount?.value ?? 0,
    jobs: jobCount?.value ?? 0,
  }
}

export async function getOperationalChecks() {
  const [database, queue, counts] = await Promise.all([checkDatabase(), checkQueue(), getCounts()])

  return {
    ok:
      database.ok &&
      queue.ok &&
      Boolean(env.APP_URL) &&
      Boolean(env.FORGEPRESS_SESSION_SECRET) &&
      Boolean(env.OPENAI_API_KEY),
    checks: {
      appUrlConfigured: Boolean(env.APP_URL),
      sessionSecretConfigured: Boolean(env.FORGEPRESS_SESSION_SECRET),
      openAiConfigured: Boolean(env.OPENAI_API_KEY),
      cloudflareConfigured: Boolean(env.CLOUDFLARE_API_TOKEN && env.CLOUDFLARE_ZONE_ID),
      database,
      queue,
    },
    counts,
    timestamp: new Date().toISOString(),
  }
}

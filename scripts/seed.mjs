/**
 * Idempotent production seed.
 *
 * Run automatically on startup (non-blocking) via start-with-migrate.mjs.
 * All operations use INSERT … ON CONFLICT DO NOTHING / DO UPDATE so they are
 * safe to re-run on every deployment.
 *
 * Required env vars:
 *   DATABASE_URL      – Postgres connection string
 *   ADMIN_EMAIL       – admin account e-mail (default: admin@forgepress.cc)
 *   ADMIN_PASSWORD    – admin account password (default: ChangeMe123!)
 *   ADMIN_NAME        – admin display name   (default: ForgePress Admin)
 */

import pg from 'pg'
import { randomBytes, scryptSync } from 'node:crypto'

const { Client } = pg

function hashPassword(plain) {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(plain, salt, 64).toString('hex')
  return `${salt}:${derived}`
}

function requireEnv(name, fallback) {
  return process.env[name] ?? fallback
}

export async function runSeed() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.warn('[seed] DATABASE_URL not set — skipping seed.')
    return
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
  })

  await client.connect()

  try {
    const adminEmail = requireEnv('ADMIN_EMAIL', 'admin@forgepress.cc')
    const adminPassword = requireEnv('ADMIN_PASSWORD', 'ChangeMe123!')
    const adminName = requireEnv('ADMIN_NAME', 'ForgePress Admin')

    // ── admin user ────────────────────────────────────────────────────────────
    const existingAdmin = await client.query(
      `SELECT id FROM admin_users WHERE email = $1 LIMIT 1`,
      [adminEmail],
    )

    let adminId
    if (existingAdmin.rowCount === 0) {
      const passwordHash = hashPassword(adminPassword)
      const result = await client.query(
        `INSERT INTO admin_users (email, password_hash, display_name, role)
         VALUES ($1, $2, $3, 'platform_admin')
         RETURNING id`,
        [adminEmail, passwordHash, adminName],
      )
      adminId = result.rows[0].id
      console.log(`[seed] Created admin user: ${adminEmail}`)
    } else {
      adminId = existingAdmin.rows[0].id
      console.log(`[seed] Admin user already exists: ${adminEmail}`)
    }

    // ── autopilot setting ─────────────────────────────────────────────────────
    await client.query(
      `INSERT INTO platform_settings (key, value)
       VALUES ('autopilot', 'true'::jsonb)
       ON CONFLICT (key) DO NOTHING`,
    )
    console.log('[seed] Autopilot setting ensured.')

    // ── nocodebuilds site ─────────────────────────────────────────────────────
    const existingSite = await client.query(
      `SELECT id FROM sites WHERE slug = 'nocodebuilds' LIMIT 1`,
    )

    let siteId
    if (existingSite.rowCount === 0) {
      const result = await client.query(
        `INSERT INTO sites (
           slug, name, default_locale, supported_locales,
           niche, gtag_id, status, created_by_admin_id
         )
         VALUES (
           'nocodebuilds',
           'NoCodeBuilds',
           'en',
           '["en","tr"]'::jsonb,
           'No-code tools, automation, and AI-assisted building',
           'G-7F9Z7V00FY',
           'active',
           $1
         )
         RETURNING id`,
        [adminId],
      )
      siteId = result.rows[0].id
      console.log(`[seed] Created site: nocodebuilds (${siteId})`)
    } else {
      siteId = existingSite.rows[0].id
      // Ensure status is active and gtag_id is set
      await client.query(
        `UPDATE sites SET status = 'active', gtag_id = 'G-7F9Z7V00FY'
         WHERE id = $1`,
        [siteId],
      )
      console.log(`[seed] Site nocodebuilds already exists (${siteId}), ensured active.`)
    }

    // ── sources ───────────────────────────────────────────────────────────────
    const sources = [
      // No-code / low-code news
      { label: 'Zapier Blog', type: 'rss', url: 'https://zapier.com/blog/feeds/latest/', locale: 'en' },
      { label: 'Make (Integromat) Blog', type: 'rss', url: 'https://www.make.com/en/blog/feed', locale: 'en' },
      { label: 'Bubble Blog', type: 'rss', url: 'https://bubble.io/blog/rss', locale: 'en' },
      { label: 'Webflow Blog', type: 'rss', url: 'https://webflow.com/blog/rss.xml', locale: 'en' },
      { label: 'Airtable Blog', type: 'rss', url: 'https://www.airtable.com/blog/rss.xml', locale: 'en' },
      { label: 'Glide Blog', type: 'rss', url: 'https://www.glideapps.com/blog/rss', locale: 'en' },
      { label: 'AppGyver Blog', type: 'rss', url: 'https://blog.appgyver.com/rss', locale: 'en' },
      { label: 'n8n Blog', type: 'rss', url: 'https://blog.n8n.io/rss/', locale: 'en' },
      // AI tools
      { label: 'OpenAI Blog', type: 'rss', url: 'https://openai.com/news/rss.xml', locale: 'en' },
      { label: 'Anthropic News', type: 'rss', url: 'https://www.anthropic.com/rss.xml', locale: 'en' },
      { label: 'Google AI Blog', type: 'rss', url: 'https://ai.googleblog.com/feeds/posts/default?alt=rss', locale: 'en' },
      { label: 'Hugging Face Blog', type: 'rss', url: 'https://huggingface.co/blog/feed.xml', locale: 'en' },
      { label: 'The Rundown AI', type: 'rss', url: 'https://www.therundown.ai/rss', locale: 'en' },
      { label: 'Ben\'s Bites', type: 'rss', url: 'https://www.bensbites.com/rss', locale: 'en' },
      // Product & startup
      { label: 'Product Hunt Daily', type: 'rss', url: 'https://www.producthunt.com/feed', locale: 'en' },
      { label: 'Indie Hackers', type: 'rss', url: 'https://www.indiehackers.com/feed.xml', locale: 'en' },
      { label: 'Hacker News (Top)', type: 'rss', url: 'https://hnrss.org/frontpage', locale: 'en' },
      // Automation
      { label: 'IFTTT Blog', type: 'rss', url: 'https://ifttt.com/blog/feed', locale: 'en' },
      { label: 'Pabbly Blog', type: 'rss', url: 'https://www.pabbly.com/blog/feed/', locale: 'en' },
      { label: 'Activepieces Blog', type: 'rss', url: 'https://www.activepieces.com/blog/rss.xml', locale: 'en' },
      // Dev tools / APIs
      { label: 'Retool Blog', type: 'rss', url: 'https://retool.com/blog/feed/', locale: 'en' },
      { label: 'Supabase Blog', type: 'rss', url: 'https://supabase.com/rss.xml', locale: 'en' },
      { label: 'Xano Blog', type: 'rss', url: 'https://www.xano.com/blog/rss', locale: 'en' },
      // Design
      { label: 'Framer Blog', type: 'rss', url: 'https://www.framer.com/blog/rss.xml', locale: 'en' },
      { label: 'Figma Blog', type: 'rss', url: 'https://www.figma.com/blog/feed/', locale: 'en' },
      // Community / roundup
      { label: 'No Code Founders', type: 'rss', url: 'https://www.nocodefounders.com/articles?format=rss', locale: 'en' },
      { label: 'NoCode HQ', type: 'rss', url: 'https://nocodehq.com/feed/', locale: 'en' },
      { label: 'Makerpad Blog', type: 'rss', url: 'https://www.makerpad.co/stories/rss', locale: 'en' },
      { label: 'Softr Blog', type: 'rss', url: 'https://www.softr.io/blog/rss', locale: 'en' },
    ]

    let insertedSources = 0
    for (const source of sources) {
      const result = await client.query(
        `INSERT INTO sources (site_id, label, type, url, locale, is_active, poll_minutes)
         VALUES ($1, $2, $3, $4, $5, true, 60)
         ON CONFLICT DO NOTHING`,
        [siteId, source.label, source.type, source.url, source.locale],
      )
      if (result.rowCount > 0) insertedSources++
    }

    console.log(
      `[seed] Sources: ${insertedSources} inserted, ${sources.length - insertedSources} already existed.`,
    )
  } finally {
    await client.end()
  }
}

/**
 * ForgePress Production Seed Script
 * Runs after migrations on first deploy.
 * Safe to run multiple times — uses ON CONFLICT DO NOTHING.
 */

import pg from 'pg'

const { Client } = pg

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required.')
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : undefined,
  })

  await client.connect()

  try {
    // ── 1. Admin user ──────────────────────────────────────────────────────────
    const adminEmail = process.env.FORGEPRESS_ADMIN_EMAIL
    const adminPassword = process.env.FORGEPRESS_ADMIN_PASSWORD

    if (adminEmail && adminPassword) {
      // Same hashing as src/lib/auth.ts: scrypt with random salt
      const { randomBytes, scryptSync } = await import('node:crypto')
      const salt = randomBytes(16).toString('hex')
      const derivedKey = scryptSync(adminPassword, salt, 64).toString('hex')
      const passwordHash = `${salt}:${derivedKey}`

      await client.query(
        `INSERT INTO admin_users (email, password_hash, display_name, role)
         VALUES ($1, $2, 'Admin', 'platform_admin')
         ON CONFLICT (email) DO NOTHING`,
        [adminEmail, passwordHash],
      )
      console.log('[seed] Admin user ready:', adminEmail)
    }

    // ── 2. Autopilot setting ───────────────────────────────────────────────────
    await client.query(
      `INSERT INTO platform_settings (key, value)
       VALUES ('autopilot', 'true')
       ON CONFLICT (key) DO UPDATE SET value = 'true'`,
    )
    console.log('[seed] Autopilot enabled.')

    // ── 3. NoCode Builds site ──────────────────────────────────────────────────
    // Look up the site by domain first to avoid creating a duplicate when the
    // site already exists under a different slug (e.g. 'nocode-builds').
    let siteId
    const domainCheck = await client.query(
      `SELECT site_id FROM site_domains WHERE hostname IN ('nocodebuilds.com', 'www.nocodebuilds.com') LIMIT 1`,
    )
    if (domainCheck.rowCount > 0) {
      siteId = domainCheck.rows[0].site_id
      await client.query(
        `UPDATE sites SET gtag_id = 'G-7F9Z7V00FY', status = 'active' WHERE id = $1`,
        [siteId],
      )
      console.log('[seed] nocodebuilds.com site already exists, id:', siteId)
    } else {
      const siteResult = await client.query(
        `INSERT INTO sites (slug, name, default_locale, supported_locales, niche, tone_guide, status, theme_preset, homepage_layout, article_layout)
         VALUES (
           'nocodebuilds',
           'NoCode Builds',
           'tr',
           '["tr","en"]'::jsonb,
           'AI araçları, no-code platformlar ve yapay zeka haberleri',
           'Bilgilendirici, anlaşılır, teknik olmayan okuyuculara uygun. Türk okuyucu kitlesine hitap eden samimi bir dil.',
           'active',
           'forge_blue',
           'spotlight',
           'editorial'
         )
         ON CONFLICT (slug) DO UPDATE SET status = 'active', gtag_id = 'G-7F9Z7V00FY'
         RETURNING id`,
      )
      siteId = siteResult.rows[0].id
      console.log('[seed] NoCode Builds site created, id:', siteId)
    }

    // ── 4. Sources ─────────────────────────────────────────────────────────────
    const sources = [
      // AI Haber
      ['OpenAI',                  'manual_url', 'https://openai.com/blog',                                    'tr', 60],
      ['Google AI',               'manual_url', 'https://ai.googleblog.com',                                  'tr', 60],
      ['DeepMind',                'manual_url', 'https://deepmind.com/blog',                                  'tr', 60],
      ['MIT Technology Review',   'manual_url', 'https://www.technologyreview.com',                           'tr', 60],
      ['VentureBeat',             'manual_url', 'https://venturebeat.com/ai',                                 'tr', 60],
      ['TechCrunch',              'manual_url', 'https://techcrunch.com/tag/artificial-intelligence',         'tr', 60],
      ['The Verge',               'manual_url', 'https://www.theverge.com/ai-artificial-intelligence',        'tr', 60],
      ['Wired',                   'manual_url', 'https://www.wired.com/tag/artificial-intelligence',          'tr', 60],
      // AI Tools
      ['Futurepedia',             'manual_url', 'https://www.futurepedia.io',                                 'tr', 120],
      ["There's An AI For That",  'manual_url', 'https://theresanaiforthat.com',                              'tr', 120],
      ['Toolify',                 'manual_url', 'https://www.toolify.ai',                                     'tr', 120],
      ['TopAI.tools',             'manual_url', 'https://topai.tools',                                        'tr', 120],
      ['Product Hunt',            'manual_url', 'https://www.producthunt.com',                                'tr', 60],
      ['FutureTools',             'manual_url', 'https://futuretools.io',                                     'tr', 120],
      // Eğitim
      ['Kaggle',                  'manual_url', 'https://www.kaggle.com',                                     'tr', 120],
      ['Coursera',                'manual_url', 'https://www.coursera.org',                                   'tr', 120],
      ['edX',                     'manual_url', 'https://www.edx.org',                                        'tr', 120],
      ['Towards Data Science',    'manual_url', 'https://towardsdatascience.com',                             'tr', 60],
      ['Analytics Vidhya',        'manual_url', 'https://www.analyticsvidhya.com',                            'tr', 60],
      // Araştırma
      ['arXiv',                   'manual_url', 'https://arxiv.org',                                          'tr', 180],
      // Prompt
      ['PromptHero',              'manual_url', 'https://prompthero.com',                                     'tr', 120],
      ['PromptBase',              'manual_url', 'https://promptbase.com',                                     'tr', 120],
      ['FlowGPT',                 'manual_url', 'https://flowgpt.com',                                        'tr', 120],
      ['Snack Prompt',            'manual_url', 'https://snackprompt.com',                                    'tr', 120],
      // Marketing
      ['HubSpot',                 'manual_url', 'https://blog.hubspot.com/marketing/ai',                      'tr', 60],
      ['Neil Patel',              'manual_url', 'https://neilpatel.com/blog',                                 'tr', 120],
      // SEO
      ['Ahrefs',                  'manual_url', 'https://ahrefs.com/blog',                                    'tr', 120],
      ['Backlinko',               'manual_url', 'https://backlinko.com/blog',                                 'tr', 120],
      ['Search Engine Journal',   'manual_url', 'https://www.searchenginejournal.com',                        'tr', 60],
    ]

    let inserted = 0
    for (const [label, type, url, locale, pollMinutes] of sources) {
      const res = await client.query(
        `INSERT INTO sources (site_id, label, type, url, locale, poll_minutes, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT DO NOTHING`,
        [siteId, label, type, url, locale, pollMinutes],
      )
      inserted += res.rowCount ?? 0
    }
    console.log(`[seed] Sources: ${inserted} inserted (rest already existed).`)

  } finally {
    await client.end()
  }
}

seed()
  .then(() => console.log('[seed] Done.'))
  .catch((err) => {
    console.error('[seed] Failed:', err.message)
    process.exit(1)
  })

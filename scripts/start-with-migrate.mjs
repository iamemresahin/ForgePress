import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { spawn } from 'node:child_process'

import pg from 'pg'

const { Client } = pg

const MIGRATIONS_DIR = join(process.cwd(), 'drizzle')
const MIGRATIONS_TABLE = 'forgepress_migrations'

async function ensureMigrationsTable(client) {
  await client.query(`
    create table if not exists ${MIGRATIONS_TABLE} (
      id text primary key,
      applied_at timestamptz not null default now()
    )
  `)
}

async function appliedMigrations(client) {
  const result = await client.query(`select id from ${MIGRATIONS_TABLE}`)
  return new Set(result.rows.map((row) => row.id))
}

async function migrationFiles() {
  const entries = await readdir(MIGRATIONS_DIR, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort()
}

async function runMigrations() {
  if (process.env.SKIP_DB_MIGRATIONS === 'true') {
    console.log('Skipping database migrations.')
    return
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to run migrations.')
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : undefined,
  })

  await client.connect()

  try {
    await ensureMigrationsTable(client)
    const applied = await appliedMigrations(client)
    const files = await migrationFiles()

    for (const file of files) {
      if (applied.has(file)) continue

      const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8')
      if (!sql.trim()) continue

      console.log(`Applying migration ${file}`)
      await client.query('begin')
      try {
        await client.query(sql)
        await client.query(`insert into ${MIGRATIONS_TABLE} (id) values ($1)`, [file])
        await client.query('commit')
      } catch (error) {
        await client.query('rollback')
        throw error
      }
    }
  } finally {
    await client.end()
  }
}

async function runSeed() {
  try {
    const seedPath = join(process.cwd(), 'scripts', 'seed.mjs')
    const { seed } = await import(seedPath).catch(() => ({ seed: null }))
    if (typeof seed === 'function') {
      await seed()
    } else {
      // seed.mjs uses top-level await, just import it
      await import(seedPath).catch((e) => console.warn('[startup] Seed skipped:', e.message))
    }
  } catch (e) {
    console.warn('[startup] Seed error (non-fatal):', e.message)
  }
}

async function main() {
  await runMigrations()
  await runSeed()

  const child = spawn('node', ['server.js'], {
    stdio: 'inherit',
    env: process.env,
  })

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
      return
    }

    process.exit(code ?? 0)
  })
}

main().catch((error) => {
  console.error('Failed to start ForgePress', error)
  process.exit(1)
})

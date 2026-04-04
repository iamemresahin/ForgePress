import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { env } from '@/lib/env'

const globalForDb = globalThis as typeof globalThis & {
  forgepressPool?: Pool
}

const pool =
  globalForDb.forgepressPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: env.NODE_ENV === 'development' ? 5 : 15,
  })

if (env.NODE_ENV !== 'production') {
  globalForDb.forgepressPool = pool
}

export const db = drizzle(pool)
export { pool }

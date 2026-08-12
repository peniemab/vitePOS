/**
-- Pool Neon (cloud Postgres). Utilisé pour health + sync future.
-- Source: DATABASE_URL ou NEON_DATABASE_URL
 */
import pg from 'pg'

let pool = null

export function getNeonPool() {
  const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL
  if (!url) return null
  if (!pool) {
    pool = new pg.Pool({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30_000,
    })
  }
  return pool
}

export async function neonHealth() {
  const p = getNeonPool()
  if (!p) return { configured: false, ok: false }
  try {
    const r = await p.query('select 1 as ok, now() as at')
    return { configured: true, ok: true, at: r.rows[0]?.at }
  } catch (err) {
    return { configured: true, ok: false, error: String(err?.message || err) }
  }
}

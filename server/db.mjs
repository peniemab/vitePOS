import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const DB_PATH = path.join(DATA_DIR, 'boutique-locale.db')

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

export const db = new DatabaseSync(DB_PATH)
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS boutiques (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'CDF',
    invite_code TEXT NOT NULL UNIQUE,
    paper_width_mm INTEGER DEFAULT 58,
    auto_print_ticket INTEGER DEFAULT 0,
    usd_rate_cdf REAL DEFAULT 2800,
    usd_rate_updated_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    boutique_id TEXT NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    pin_hash TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_users_boutique ON users(boutique_id);

  CREATE TABLE IF NOT EXISTS sync_snapshots (
    invite_code TEXT PRIMARY KEY,
    boutique_id TEXT NOT NULL,
    revision INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS sync_entities (
    invite_code TEXT NOT NULL,
    table_name TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (invite_code, table_name, entity_id)
  );

  CREATE TABLE IF NOT EXISTS sync_events (
    id TEXT PRIMARY KEY,
    invite_code TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sync_events_code ON sync_events(invite_code, created_at);
`)

export function rowToBoutique(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    currency: row.currency,
    inviteCode: row.invite_code,
    paperWidthMm: row.paper_width_mm,
    autoPrintTicket: !!row.auto_print_ticket,
    usdRateCdf: row.usd_rate_cdf,
    usdRateUpdatedAt: row.usd_rate_updated_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function rowToUser(row) {
  if (!row) return null
  return {
    id: row.id,
    boutiqueId: row.boutique_id,
    name: row.name,
    role: row.role,
    active: !!row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function publicUser(row) {
  const u = rowToUser(row)
  if (!u) return null
  return { ...u, boutiqueId: row.boutique_id || row.boutiqueId }
}

export function getBoutiqueById(id) {
  return rowToBoutique(db.prepare('SELECT * FROM boutiques WHERE id = ?').get(id))
}

export function getBoutiqueByInvite(code) {
  const safe = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  return rowToBoutique(db.prepare('SELECT * FROM boutiques WHERE invite_code = ?').get(safe))
}

export function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id)
}

export function getUsersByBoutique(boutiqueId) {
  return db.prepare('SELECT * FROM users WHERE boutique_id = ? ORDER BY created_at ASC').all(boutiqueId)
}

export function upsertBoutique(b) {
  db.prepare(`
    INSERT INTO boutiques (
      id, name, currency, invite_code, paper_width_mm, auto_print_ticket,
      usd_rate_cdf, usd_rate_updated_at, created_at, updated_at
    ) VALUES (
      @id, @name, @currency, @inviteCode, @paperWidthMm, @autoPrintTicket,
      @usdRateCdf, @usdRateUpdatedAt, @createdAt, @updatedAt
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      currency = excluded.currency,
      invite_code = excluded.invite_code,
      paper_width_mm = excluded.paper_width_mm,
      auto_print_ticket = excluded.auto_print_ticket,
      usd_rate_cdf = excluded.usd_rate_cdf,
      usd_rate_updated_at = excluded.usd_rate_updated_at,
      updated_at = excluded.updated_at
  `).run({
    id: b.id,
    name: b.name,
    currency: b.currency,
    inviteCode: b.inviteCode,
    paperWidthMm: b.paperWidthMm ?? 58,
    autoPrintTicket: b.autoPrintTicket ? 1 : 0,
    usdRateCdf: b.usdRateCdf ?? 2800,
    usdRateUpdatedAt: b.usdRateUpdatedAt ?? null,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  })
}

export function upsertUser(u) {
  db.prepare(`
    INSERT INTO users (id, boutique_id, name, role, pin_hash, active, created_at, updated_at)
    VALUES (@id, @boutiqueId, @name, @role, @pinHash, @active, @createdAt, @updatedAt)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      role = excluded.role,
      pin_hash = excluded.pin_hash,
      active = excluded.active,
      updated_at = excluded.updated_at
  `).run({
    id: u.id,
    boutiqueId: u.boutiqueId,
    name: u.name,
    role: u.role,
    pinHash: u.pinHash,
    active: u.active ? 1 : 0,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  })
}

export function ensureSyncSnapshot(inviteCode, boutiqueId) {
  const safe = String(inviteCode).toUpperCase()
  db.prepare(`
    INSERT INTO sync_snapshots (invite_code, boutique_id, revision, updated_at)
    VALUES (?, ?, 0, ?)
    ON CONFLICT(invite_code) DO NOTHING
  `).run(safe, boutiqueId, Date.now())
}

export function loadSyncPayload(inviteCode) {
  const safe = String(inviteCode).toUpperCase().replace(/[^A-Z0-9]/g, '')
  const snap = db.prepare('SELECT * FROM sync_snapshots WHERE invite_code = ?').get(safe)
  if (!snap) {
    return { inviteCode: safe, revision: 0, entities: {}, events: [], updatedAt: null }
  }

  const entityRows = db
    .prepare('SELECT table_name, entity_id, payload, updated_at FROM sync_entities WHERE invite_code = ?')
    .all(safe)

  const entities = {}
  for (const row of entityRows) {
    if (!entities[row.table_name]) entities[row.table_name] = {}
    entities[row.table_name][row.entity_id] = JSON.parse(row.payload)
  }

  const events = db
    .prepare('SELECT payload FROM sync_events WHERE invite_code = ? ORDER BY created_at ASC')
    .all(safe)
    .map((r) => JSON.parse(r.payload))

  return {
    inviteCode: safe,
    revision: snap.revision,
    entities,
    events,
    updatedAt: snap.updated_at,
  }
}

export function mergeSyncPayload(inviteCode, boutiqueId, incoming) {
  const safe = String(inviteCode).toUpperCase().replace(/[^A-Z0-9]/g, '')
  ensureSyncSnapshot(safe, boutiqueId)

  const upsertEntity = db.prepare(`
    INSERT INTO sync_entities (invite_code, table_name, entity_id, payload, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(invite_code, table_name, entity_id) DO UPDATE SET
      payload = excluded.payload,
      updated_at = excluded.updated_at
    WHERE excluded.updated_at >= sync_entities.updated_at
  `)

  db.exec('BEGIN IMMEDIATE')
  try {
    for (const [table, rows] of Object.entries(incoming.entities || {})) {
      for (const row of rows) {
        if (!row?.id) continue
        const updatedAt = row.updatedAt || Date.now()
        const existing = db
          .prepare(
            'SELECT updated_at FROM sync_entities WHERE invite_code = ? AND table_name = ? AND entity_id = ?',
          )
          .get(safe, table, row.id)
        if (existing && (existing.updated_at || 0) > updatedAt) continue
        upsertEntity.run(safe, table, row.id, JSON.stringify(row), updatedAt)

        if (table === 'boutiques') upsertBoutique(row)
        // users table : auth serveur uniquement (bcrypt), pas via sync client
      }
    }

    const insertEvent = db.prepare(`
      INSERT OR IGNORE INTO sync_events (id, invite_code, payload, created_at)
      VALUES (?, ?, ?, ?)
    `)
    for (const ev of incoming.events || []) {
      if (!ev?.id) continue
      insertEvent.run(ev.id, safe, JSON.stringify(ev), ev.createdAt || Date.now())
    }

    const snap = db.prepare('SELECT revision FROM sync_snapshots WHERE invite_code = ?').get(safe)
    const revision = (snap?.revision || 0) + 1
    const updatedAt = Date.now()
    db.prepare('UPDATE sync_snapshots SET revision = ?, updated_at = ? WHERE invite_code = ?').run(
      revision,
      updatedAt,
      safe,
    )
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }

  return loadSyncPayload(safe)
}

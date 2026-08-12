import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL
if (!databaseUrl) {
  console.error('Manque DATABASE_URL (ou NEON_DATABASE_URL) dans .env')
  console.error('Exemple: copiez la connection string pooled depuis le dashboard Neon.')
  process.exit(1)
}

const schemaPath = path.join(root, 'neon', '001_schema.sql')
const sql = fs.readFileSync(schemaPath, 'utf8')

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  console.log('Connecté à Neon…')
  await client.query(sql)
  const tables = await client.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name
  `)
  console.log('Migration OK. Tables public :')
  for (const row of tables.rows) console.log(' -', row.table_name)
} catch (err) {
  console.error('Migration échouée:', err.message || err)
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}

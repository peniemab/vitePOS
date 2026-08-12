import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import authRoutes from './routes/auth.mjs'
import syncRoutes from './routes/sync.mjs'
import { neonHealth } from './neon.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || process.env.SYNC_PORT || 3789)
const DIST = path.join(__dirname, '..', 'dist')

const app = express()
app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '10mb' }))

app.get('/api/health', async (_req, res) => {
  const neon = await neonHealth()
  res.json({
    ok: true,
    mode: 'production-api',
    db: { sqlite: true, neon },
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/sync', syncRoutes)

if (fs.existsSync(DIST)) {
  app.use(express.static(DIST))
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(DIST, 'index.html'))
  })
}

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`vitePOS API on http://0.0.0.0:${PORT}`)
  if (fs.existsSync(DIST)) {
    console.log(`Serving frontend from ${DIST}`)
  } else {
    console.log('Frontend dist/ not found — API only (run npm run build for production)')
  }
})

import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const nextBin = require.resolve('next/dist/bin/next')

const api = spawn(process.execPath, ['server/index.mjs'], {
  stdio: 'inherit',
  shell: false,
  env: { ...process.env, SERVE_DIST: process.env.SERVE_DIST || '0' },
})

const web = spawn(process.execPath, [nextBin, 'dev'], {
  stdio: 'inherit',
  shell: false,
})

function shutdown() {
  api.kill()
  web.kill()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

web.on('exit', (code) => {
  api.kill()
  process.exit(code ?? 0)
})

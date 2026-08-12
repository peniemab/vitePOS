import { spawn } from 'node:child_process'

const api = spawn(process.execPath, ['server/index.mjs'], {
  stdio: 'inherit',
  shell: false,
})

const vite = spawn('npx', ['vite'], {
  stdio: 'inherit',
  shell: true,
})

function shutdown() {
  api.kill()
  vite.kill()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

vite.on('exit', (code) => {
  api.kill()
  process.exit(code ?? 0)
})

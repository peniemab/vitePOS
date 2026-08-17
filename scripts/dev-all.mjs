import { spawn } from 'node:child_process'

const api = spawn(process.execPath, ['server/index.mjs'], {
  stdio: 'inherit',
  shell: false,
})

const web = spawn('npx', ['next', 'dev'], {
  stdio: 'inherit',
  shell: true,
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

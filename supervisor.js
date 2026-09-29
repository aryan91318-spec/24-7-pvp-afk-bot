const { spawn } = require('child_process')
require('./health-server')

const DELAY = Number(process.env.RESTART_DELAY_MS || 5000)
let stopping = false
let child

function start() {
  console.log(`[SUPERVISOR] Starting bot at ${new Date().toISOString()}`)
  child = spawn(process.execPath, ['bot.js'], {
    stdio: 'inherit',
    env: process.env
  })

  child.on('exit', (code, signal) => {
    if (stopping) return
    console.log(`[SUPERVISOR] Bot exited code=${code} signal=${signal}. Restarting in ${DELAY}ms...`)
    setTimeout(start, DELAY)
  })

  child.on('error', err => {
    console.error('[SUPERVISOR] Failed to start bot:', err)
  })
}

function stop() {
  stopping = true
  if (child) child.kill('SIGINT')
  setTimeout(() => process.exit(0), 1500).unref()
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)
start()

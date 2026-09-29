const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const { GoalNear } = goals
const collectBlock = require('mineflayer-collectblock').plugin
const autoEat = require('mineflayer-auto-eat').loader

const CONFIG = {
  host: process.env.MC_HOST || 'PUPOMC.aternos.me',
  port: Number(process.env.MC_PORT || 53902),
  username: process.env.MC_USERNAME || 'REDNOVA_AI',
  auth: process.env.MC_AUTH || 'offline',
  version: process.env.MC_VERSION || false,
  reconnectMs: Number(process.env.RECONNECT_MS || 10000),
  owner: process.env.OWNER_NAME || ''
}

let bot
let mcData
let defaultMove
let reconnectTimer
let task = 'idle'
let stopping = false

const WOOD = [
  'oak_log','spruce_log','birch_log','jungle_log','acacia_log',
  'dark_oak_log','mangrove_log','cherry_log','pale_oak_log'
]

const ORES = [
  'coal_ore','deepslate_coal_ore',
  'iron_ore','deepslate_iron_ore',
  'copper_ore','deepslate_copper_ore',
  'gold_ore','deepslate_gold_ore',
  'redstone_ore','deepslate_redstone_ore',
  'lapis_ore','deepslate_lapis_ore',
  'diamond_ore','deepslate_diamond_ore',
  'emerald_ore','deepslate_emerald_ore'
]

function say(msg) {
  if (bot && bot.player) bot.chat(msg)
  console.log('[BOT]', msg)
}

function isAllowed(username) {
  return !CONFIG.owner || username === CONFIG.owner
}

function makeBot() {
  stopping = false
  bot = mineflayer.createBot({
    host: CONFIG.host,
    port: CONFIG.port,
    username: CONFIG.username,
    auth: CONFIG.auth,
    version: CONFIG.version || undefined
  })

  bot.loadPlugin(pathfinder)
  bot.loadPlugin(collectBlock)
  bot.loadPlugin(autoEat)

  bot.once('spawn', () => {
    mcData = require('minecraft-data')(bot.version)
    defaultMove = new Movements(bot, mcData)
    defaultMove.canDig = true
    defaultMove.allow1by1towers = false
    bot.pathfinder.setMovements(defaultMove)

    console.log(`Connected to ${CONFIG.host}:${CONFIG.port} as ${bot.username} (${bot.version})`)
    say('REDNOVA AI online! Type !help')
  })

  bot.on('chat', async (username, message) => {
    if (username === bot.username || !isAllowed(username)) return
    const [cmd, ...args] = message.trim().split(/\s+/)
    if (!cmd.startsWith('!')) return

    try {
      switch (cmd.toLowerCase()) {
        case '!help':
          say('!come !follow !stop !wood !mine !status !goto x y z !inv')
          break

        case '!come': {
          const p = bot.players[username]?.entity?.position
          if (!p) return say('I cannot see you.')
          task = 'come'
          bot.pathfinder.setGoal(new GoalNear(p.x, p.y, p.z, 2))
          say('Coming.')
          break
        }

        case '!follow': {
          const target = bot.players[username]?.entity
          if (!target) return say('I cannot see you.')
          task = `follow:${username}`
          bot.pathfinder.setGoal(new goals.GoalFollow(target, 2), true)
          say('Following you.')
          break
        }

        case '!goto': {
          if (args.length !== 3) return say('Use !goto x y z')
          const [x,y,z] = args.map(Number)
          if (![x,y,z].every(Number.isFinite)) return say('Coordinates must be numbers.')
          task = 'goto'
          await bot.pathfinder.goto(new goals.GoalNear(x, y, z, 1))
          say('Arrived.')
          break
        }

        case '!wood':
          await doWood()
          break

        case '!mine':
          await doMine()
          break

        case '!stop':
          task = 'idle'
          bot.pathfinder.setGoal(null)
          bot.stopDigging()
          say('Stopped.')
          break

        case '!status':
          say(`task=${task} hp=${bot.health.toFixed(1)} food=${bot.food} pos=${bot.entity.position.floored()}`)
          break

        case '!inv':
          say(bot.inventory.items().map(i => `${i.name}x${i.count}`).join(', ').slice(0, 240) || 'Inventory empty.')
          break

        default:
          say('Unknown command. Type !help')
      }
    } catch (err) {
      console.error(err)
      say(`Task error: ${err.message.slice(0, 120)}`)
      task = 'idle'
    }
  })

  bot.on('autoeat_started', () => console.log('Auto-eat started'))
  bot.on('autoeat_finished', () => console.log('Auto-eat finished'))

  bot.on('kicked', reason => {
    console.log('Kicked:', reason)
  })

  bot.on('error', err => {
    console.error('Bot error:', err.message)
  })

  bot.on('end', () => {
    console.log('Disconnected. Reconnecting...')
    task = 'idle'
    if (!stopping) {
      clearTimeout(reconnectTimer)
      reconnectTimer = setTimeout(makeBot, CONFIG.reconnectMs)
    }
  })
}

async function collectNearest(names, amount = 8) {
  const ids = names.map(n => mcData.blocksByName[n]?.id).filter(Boolean)
  if (!ids.length) throw new Error('Requested blocks are not available in this Minecraft version.')

  let collected = 0
  while (collected < amount && bot.entity) {
    const block = bot.findBlock({ matching: ids, maxDistance: 48 })
    if (!block) break
    await bot.collectBlock.collect(block)
    collected++
  }
  return collected
}

async function doWood() {
  if (!mcData) return
  task = 'wood'
  say('Wood mode started.')
  const n = await collectNearest(WOOD, 12)
  task = 'idle'
  say(`Wood mode done. Collected about ${n} logs.`)
}

async function doMine() {
  if (!mcData) return
  task = 'mine'
  say('Mining mode started.')
  const n = await collectNearest(ORES, 12)
  task = 'idle'
  say(`Mining mode done. Collected about ${n} ore blocks.`)
}

// Keep the Node process alive and periodically print a heartbeat.
// The bot can run for 40+ hours if the device/server hosting this process
// stays powered and connected. It does not bypass server AFK rules.
setInterval(() => {
  if (bot?.player) {
    console.log(`[HEARTBEAT] ${new Date().toISOString()} task=${task} hp=${bot.health}`)
  }
}, 5 * 60 * 1000)

process.on('SIGINT', () => {
  stopping = true
  clearTimeout(reconnectTimer)
  if (bot) bot.quit('Stopping REDNOVA AI')
  process.exit(0)
})

makeBot()

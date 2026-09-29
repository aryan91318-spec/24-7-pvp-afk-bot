const http = require('http')

const port = Number(process.env.PORT || 10000)

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'application/json'})
  res.end(JSON.stringify({
    status: 'ok',
    service: 'REDNOVA AI Minecraft Bot',
    minecraft: `${process.env.MC_HOST || 'PUPOMC.aternos.me'}:${process.env.MC_PORT || '53902'}`
  }))
})

server.listen(port, '0.0.0.0', () => {
  console.log(`[HEALTH] HTTP health server listening on 0.0.0.0:${port}`)
})

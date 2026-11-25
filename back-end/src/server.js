import 'dotenv/config'
import { createApp } from './app.js'
import { connectAccountStore } from './stores/mongoAccountStore.js'

const mongoUri = process.env.MONGODB_URI
let accountStores
if (mongoUri) {
  try {
    accountStores = await connectAccountStore(mongoUri)
  } catch {
    console.error('Could not connect to the StockSim database. Check MONGODB_URI and Atlas access.')
    process.exit(1)
  }
}
const app = createApp(accountStores)

const port = Number(process.env.PORT || 3001)

const server = app.listen(port, () => {
  console.log(`StockSim API listening on http://localhost:${port}`)
})

server.on('error', (error) => {
  console.error(`Could not start StockSim API: ${error.message}`)
  process.exitCode = 1
  accountStores?.close().catch(() => {})
})

async function stop() {
  server.close(async () => {
    try {
      await accountStores?.close()
    } catch {
      process.exitCode = 1
    }
  })
}
process.once('SIGINT', stop)
process.once('SIGTERM', stop)

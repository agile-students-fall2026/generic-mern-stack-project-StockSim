import express from 'express'
import cookieParser from 'cookie-parser'
import { createSessionService } from './services/sessions.js'
import { createPasswordRecovery } from './services/passwordRecovery.js'
import createAuthRouter from './routes/auth.js'
import { createStocksRouter } from './routes/stocks.js'
import { createMemoryUserStore } from './stores/memoryUserStore.js'
import { createHoldingsRouter } from './routes/holdings.js'
import { createPortfolioRouter } from './routes/portfolio.js'

export function createApp({ userStore = createMemoryUserStore(), sessions = createSessionService(), recovery } = {}) {
  recovery ??= createPasswordRecovery({ userStore, sessions })
  const app = express()

  app.disable('x-powered-by')
  app.use(express.json({ limit: '10kb' }))
  app.use(cookieParser())

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/auth', createAuthRouter(userStore, sessions, recovery))
  app.use('/api/stocks', createStocksRouter())
  app.use('/api/holdings', createHoldingsRouter())
  app.use('/api/portfolio', createPortfolioRouter())

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } })
  })

  // Keep API errors in JSON without exposing request bodies or stack traces.
  app.use((error, _req, res, next) => {
    if (res.headersSent) return next(error)

    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } })
    }

    if (error.type === 'entity.too.large') {
      return res.status(413).json({ error: { code: 'BODY_TOO_LARGE', message: 'Request body exceeds the 10 KB limit.' } })
    }

    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } })
  })

  return app
}

export default createApp()

import express from 'express'
import cookieParser from 'cookie-parser'
import { createSessionService } from './services/sessions.js'
import { createPasswordRecovery } from './services/passwordRecovery.js'
import createAuthRouter from './routes/auth.js'
import { requireAuth } from './middleware/requireAuth.js'
import { trustedOrigin } from './middleware/trustedOrigin.js'
import { createWatchlistRouter } from './routes/watchlist.js'
import { createSavedQuote, createStocksRouter } from './routes/stocks.js'
import { createMemoryUserStore } from './stores/memoryUserStore.js'
import { createHoldingsRouter } from './routes/holdings.js'
import { createLessonsRouter } from './routes/lessons.js'
import { createGlossaryRouter } from './routes/glossary.js'
import { createPortfolioRouter } from './routes/portfolio.js'

export function createApp({ userStore = createMemoryUserStore(), sessions = createSessionService(), recovery, watchlistStore, quote = createSavedQuote() } = {}) {
  recovery ??= createPasswordRecovery({ userStore, sessions })
  const app = express()

  app.disable('x-powered-by')
  app.use(express.json({ limit: '10kb' }))
  app.use(cookieParser())

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/auth', createAuthRouter(userStore, sessions, recovery))
  app.use('/api/stocks', createStocksRouter({ quote }))
  if (watchlistStore) {
    app.use('/api/watchlist', trustedOrigin, requireAuth(userStore, sessions), createWatchlistRouter({
      getAuthenticatedUserId: req => req.user.id,
      store: watchlistStore,
      quote,
    }))
  } else {
    app.use('/api/watchlist', (_req, res) => res.status(503).json({
      error: { code: 'WATCHLIST_NOT_CONFIGURED', message: 'Account watchlist storage is not configured.' },
    }))
  }
  app.use('/api/holdings', createHoldingsRouter())
  app.use('/api/lessons', createLessonsRouter())
  app.use('/api/glossary', createGlossaryRouter())
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

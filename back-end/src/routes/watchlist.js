import { Router } from 'express'
import { normalizeStockSymbol } from '../services/stockQuote.js'

const maxItems = 10

// Wire up only with a trusted session resolver and a durable per-user store.
export function createWatchlistRouter({ getAuthenticatedUserId, store, quote }) {
  if (typeof getAuthenticatedUserId !== 'function' || typeof quote !== 'function'
    || !['list', 'add', 'remove'].every(method => typeof store?.[method] === 'function')) {
    throw new TypeError('Watchlist requires a trusted session resolver, store, and quote service.')
  }
  const router = Router()
  const fail = (res, status, code, message) => res.status(status).json({ error: { code, message } })
  router.use(async (req, res, next) => {
    const userId = await getAuthenticatedUserId(req)
    if (typeof userId !== 'string' || !userId.trim()) {
      return fail(res, 401, 'AUTH_REQUIRED', 'Sign in to access your watchlist.')
    }
    res.locals.watchlistUserId = userId
    res.set('Cache-Control', 'no-store')
    next()
  })

  router.get('/', async (_req, res) => {
    const symbols = await store.list(res.locals.watchlistUserId)
    const items = symbols.map(symbol => ({ symbol, price: null, change: null, quote: null, quoteStatus: 'unavailable' }))
    // Use up to three lookups at once and bound the time the list waits for quotes.
    // Quote transport has its own timeout. Do not initiate more calls after expiry.
    let cursor = 0
    let expired = false
    let timeout
    async function worker() {
      while (!expired && cursor < items.length) {
        const index = cursor++
        try {
          const value = await quote(items[index].symbol)
          if (!expired) items[index] = { ...items[index], price: value.price, change: value.change, quote: value, quoteStatus: 'available' }
        } catch {
          // A provider failure must not hide saved symbols or render fake prices.
        }
      }
    }
    await Promise.race([
      Promise.all([worker(), worker(), worker()]),
      new Promise(resolve => { timeout = setTimeout(() => { expired = true; resolve() }, 7000) }),
    ])
    clearTimeout(timeout)
    res.json({ items })
  })

  router.post('/', async (req, res) => {
    const symbol = normalizeStockSymbol(req.body?.symbol)
    if (!symbol) return fail(res, 400, 'INVALID_SYMBOL', 'Provide a valid stock symbol.')
    const outcome = await store.add(res.locals.watchlistUserId, symbol, maxItems)
    if (outcome === 'full') return fail(res, 409, 'WATCHLIST_FULL', 'Your watchlist is full.')
    if (outcome !== 'added' && outcome !== 'exists') throw new Error('Unexpected watchlist store result')
    res.status(outcome === 'added' ? 201 : 200).json({ symbol, added: outcome === 'added' })
  })

  router.delete('/:symbol', async (req, res) => {
    const symbol = normalizeStockSymbol(req.params.symbol)
    if (!symbol) return fail(res, 400, 'INVALID_SYMBOL', 'Provide a valid stock symbol.')
    await store.remove(res.locals.watchlistUserId, symbol)
    res.sendStatus(204)
  })

  return router
}

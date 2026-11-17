import { Router } from 'express'
import { createStockSearch, StockSearchError } from '../services/stockSearch.js'

export function createStocksRouter({ search = createStockSearch() } = {}) {
  const router = Router()
  router.get('/search', async (req, res, next) => {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    if (!query || query.length > 100 || [...query].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) {
      return res.status(400).json({ error: { code: 'INVALID_QUERY', message: 'Provide one non-empty q string of up to 100 characters without control characters.' } })
    }
    try {
      const results = await search(query)
      res.json({ query, results, count: results.length })
    } catch (error) {
      if (error instanceof StockSearchError) {
        return res.status(error.status).json({ error: { code: error.code, message: error.message } })
      }
      next(error)
    }
  })
  return router
}

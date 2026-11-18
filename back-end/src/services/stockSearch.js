const messages = {
  SEARCH_NOT_CONFIGURED: 'Stock search is not configured.',
  SEARCH_RATE_LIMITED: 'Stock search is temporarily rate limited. Try again later.',
  SEARCH_TIMEOUT: 'Stock search timed out. Try again later.',
  SEARCH_UNAVAILABLE: 'Stock search is temporarily unavailable.',
}

export class StockSearchError extends Error {
  constructor(code, status) {
    super(messages[code])
    this.code = code
    this.status = status
  }
}

const unavailable = () => new StockSearchError('SEARCH_UNAVAILABLE', 502)

export function createStockSearch({
  apiKey = process.env.ALPHA_VANTAGE_API_KEY,
  fetchFn = globalThis.fetch,
  now = Date.now,
  timeoutMs = 5000,
  cacheTtlMs = 300000,
  cacheLimit = 100,
} = {}) {
  const cache = new Map()
  const pending = new Map()
  let limitedUntil = 0

  async function load(query, cacheKey) {
    const url = new URL('https://www.alphavantage.co/query')
    url.search = new URLSearchParams({ function: 'SYMBOL_SEARCH', keywords: query, apikey: apiKey })
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetchFn(url, { signal: controller.signal, redirect: 'error' })
      if (response.status === 429) {
        limitedUntil = now() + 60000
        throw new StockSearchError('SEARCH_RATE_LIMITED', 503)
      }
      if (!response.ok) throw unavailable()
      const body = await response.json()
      if (!body || typeof body !== 'object') throw unavailable()
      // Alpha Vantage can report quota/errors in a successful HTTP response.
      if (body.Note || body.Information) {
        const notice = String(body.Note || body.Information)
        if (/rate|limit|frequency|requests per/i.test(notice)) {
          limitedUntil = now() + 60000
          throw new StockSearchError('SEARCH_RATE_LIMITED', 503)
        }
        throw unavailable()
      }
      if (body['Error Message'] || !Array.isArray(body.bestMatches)) throw unavailable()
      const results = []
      const seen = new Set()
      const optional = value => typeof value === 'string' && value.trim() ? value.trim() : null
      for (const match of body.bestMatches) {
        if (!match || typeof match !== 'object') continue
        const symbol = optional(match['1. symbol'])
        const name = optional(match['2. name'])
        if (!symbol || !name || seen.has(symbol)) continue
        seen.add(symbol)
        results.push({ symbol, name, type: optional(match['3. type']), region: optional(match['4. region']), currency: optional(match['8. currency']) })
      }
      if (body.bestMatches.length && !results.length) throw unavailable()
      cache.set(cacheKey, { results, expires: now() + cacheTtlMs })
      if (cache.size > cacheLimit) cache.delete(cache.keys().next().value)
      return results
    } catch (error) {
      if (error instanceof StockSearchError) throw error
      if (controller.signal.aborted) throw new StockSearchError('SEARCH_TIMEOUT', 504)
      // Never forward upstream errors: their text may contain the API key/URL.
      throw unavailable()
    } finally {
      clearTimeout(timeout)
    }
  }

  return async query => {
    if (typeof apiKey !== 'string' || !apiKey.trim()) throw new StockSearchError('SEARCH_NOT_CONFIGURED', 503)
    const cacheKey = query.toLowerCase()
    const cached = cache.get(cacheKey)
    if (cached && cached.expires > now()) return cached.results
    if (cached) cache.delete(cacheKey)
    if (limitedUntil > now()) throw new StockSearchError('SEARCH_RATE_LIMITED', 503)
    if (pending.has(cacheKey)) return pending.get(cacheKey)
    const promise = load(query, cacheKey)
    pending.set(cacheKey, promise)
    try {
      return await promise
    } finally {
      pending.delete(cacheKey)
    }
  }
}

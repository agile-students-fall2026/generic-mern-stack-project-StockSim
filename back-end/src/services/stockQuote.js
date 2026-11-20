const errors = {
  QUOTE_NOT_FOUND: [404, 'No quote is available for this symbol.'],
  QUOTE_NOT_CONFIGURED: [503, 'Stock quotes are not configured.'],
  QUOTE_RATE_LIMITED: [503, 'Stock quotes are temporarily rate limited. Try again later.'],
  QUOTE_BUSY: [503, 'Stock quotes are temporarily busy. Try again later.'],
  QUOTE_TIMEOUT: [504, 'Stock quote request timed out. Try again later.'],
  QUOTE_UNAVAILABLE: [502, 'Stock quote is temporarily unavailable.'],
}

export class StockQuoteError extends Error {
  constructor(code) {
    const [status, message] = errors[code]
    super(message)
    this.code = code
    this.status = status
  }
}

export function normalizeStockSymbol(value) {
  const symbol = typeof value === 'string' ? value.trim().toUpperCase() : ''
  return /^[A-Z0-9][A-Z0-9.^-]{0,23}$/.test(symbol) ? symbol : null
}

function decimal(value, percent = false) {
  if (typeof value !== 'string' || !(percent ? /^[+-]?\d+(\.\d+)?%$/ : /^[+-]?\d+(\.\d+)?$/).test(value)) return null
  const number = Number(percent ? value.slice(0, -1) : value)
  return Number.isFinite(number) ? number : null
}

function tradingDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const day = new Date(value)
  return Number.isFinite(day.getTime()) && day.toISOString().slice(0, 10) === value ? value : null
}

export function createStockQuote({
  apiKey = process.env.ALPHA_VANTAGE_API_KEY,
  fetchFn = globalThis.fetch,
  now = Date.now,
  timeoutMs = 5000,
} = {}) {
  const cache = new Map()
  const pending = new Map()
  let limitedUntil = 0

  async function load(symbol) {
    const url = new URL('https://www.alphavantage.co/query')
    url.search = new URLSearchParams({ function: 'GLOBAL_QUOTE', symbol, apikey: apiKey.trim() })
    const signal = AbortSignal.timeout(timeoutMs)
    try {
      const response = await fetchFn(url, { signal, redirect: 'error' })
      const body = response.ok ? await response.json() : null
      const notice = body?.Note || body?.Information
      if (response.status === 429 || (typeof notice === 'string' && /rate limit|frequency|requests per/i.test(notice))) {
        limitedUntil = now() + 60000
        throw new StockQuoteError('QUOTE_RATE_LIMITED')
      }
      const raw = body?.['Global Quote']
      if (!response.ok || notice || body?.['Error Message'] || !raw || typeof raw !== 'object' || Array.isArray(raw)) {
        throw new StockQuoteError('QUOTE_UNAVAILABLE')
      }
      if (!Object.keys(raw).length) throw new StockQuoteError('QUOTE_NOT_FOUND')
      const price = decimal(raw['05. price'])
      const change = decimal(raw['09. change'])
      if (normalizeStockSymbol(raw['01. symbol']) !== symbol || !(price > 0) || change === null) {
        throw new StockQuoteError('QUOTE_UNAVAILABLE')
      }
      const fetchedAt = now()
      return {
        symbol, price, change, changePercent: decimal(raw['10. change percent'], true),
        tradingDate: tradingDate(raw['07. latest trading day']),
        quoteTimestamp: null,
        fetchedAt: new Date(fetchedAt).toISOString(),
        dataTiming: 'end_of_day',
      }
    } catch (error) {
      if (error instanceof StockQuoteError) throw error
      throw new StockQuoteError(signal.aborted ? 'QUOTE_TIMEOUT' : 'QUOTE_UNAVAILABLE')
    }
  }

  return async symbol => {
    if (typeof apiKey !== 'string' || !apiKey.trim()) throw new StockQuoteError('QUOTE_NOT_CONFIGURED')
    const cached = cache.get(symbol)
    if (cached?.expires > now()) {
      if (cached.value === null) throw new StockQuoteError('QUOTE_NOT_FOUND')
      return cached.value
    }
    if (cached) cache.delete(symbol)
    if (pending.has(symbol)) return pending.get(symbol)
    if (limitedUntil > now()) throw new StockQuoteError('QUOTE_RATE_LIMITED')
    if (pending.size >= 3) throw new StockQuoteError('QUOTE_BUSY')
    function remember(value, ttl) {
      cache.set(symbol, { value, expires: now() + ttl })
      if (cache.size > 100) cache.delete(cache.keys().next().value)
    }
    const promise = load(symbol).then(value => {
      remember(value, 900000)
      return value
    }).catch(error => {
      if (error.code === 'QUOTE_NOT_FOUND') remember(null, 60000)
      throw error
    }).finally(() => pending.delete(symbol))
    pending.set(symbol, promise)
    return promise
  }
}

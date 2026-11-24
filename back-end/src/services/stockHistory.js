const errors = {
  HISTORY_NOT_FOUND: [404, 'No price history is available for this symbol.'],
  HISTORY_NOT_CONFIGURED: [503, 'Price history is not configured.'],
  HISTORY_RATE_LIMITED: [503, 'Price history is temporarily rate limited. Try again later.'],
  HISTORY_BUSY: [503, 'Price history is temporarily busy. Try again later.'],
  HISTORY_TIMEOUT: [504, 'Price history request timed out. Try again later.'],
  HISTORY_UNAVAILABLE: [502, 'Price history is temporarily unavailable.'],
}

export class StockHistoryError extends Error {
  constructor(code) {
    const [status, message] = errors[code]
    super(message)
    this.code = code
    this.status = status
  }
}

function closingPoints(series) {
  if (!series || typeof series !== 'object' || Array.isArray(series)) return null
  return Object.entries(series)
    .map(([date, day]) => ({ date, price: Number(day?.['4. close']) }))
    .filter(({ date, price }) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(price) && price > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function createStockHistory({
  apiKey = process.env.ALPHA_VANTAGE_API_KEY,
  fetchFn = globalThis.fetch,
  now = Date.now,
  timeoutMs = 15000,
  cacheTtlMs = 6 * 60 * 60 * 1000,
  store = null,
} = {}) {
  const cache = new Map()
  const pending = new Map()
  let limitedUntil = 0

  async function load(symbol) {
    const url = new URL('https://www.alphavantage.co/query')
    url.search = new URLSearchParams({ function: 'TIME_SERIES_DAILY', symbol, apikey: apiKey.trim() })
    const signal = AbortSignal.timeout(timeoutMs)
    try {
      const response = await fetchFn(url, { signal, redirect: 'error' })
      const body = response.ok ? await response.json() : null
      const notice = body?.Note || body?.Information
      if (response.status === 429 || (typeof notice === 'string' && /rate limit|frequency|requests per/i.test(notice))) {
        limitedUntil = now() + 60000
        throw new StockHistoryError('HISTORY_RATE_LIMITED')
      }
      if (body?.['Error Message']) throw new StockHistoryError('HISTORY_NOT_FOUND')
      const points = response.ok && !notice ? closingPoints(body?.['Time Series (Daily)']) : null
      if (!points?.length) throw new StockHistoryError('HISTORY_UNAVAILABLE')
      return { symbol, dataTiming: 'end_of_day', points, fetchedAt: new Date(now()).toISOString() }
    } catch (error) {
      if (error instanceof StockHistoryError) throw error
      throw new StockHistoryError(signal.aborted ? 'HISTORY_TIMEOUT' : 'HISTORY_UNAVAILABLE')
    }
  }

  return async symbol => {
    if (typeof apiKey !== 'string' || !apiKey.trim()) throw new StockHistoryError('HISTORY_NOT_CONFIGURED')
    let cached = cache.get(symbol)
    if (!cached) {
      const saved = store?.get(symbol)
      if (saved?.value?.symbol === symbol && saved.value.dataTiming === 'end_of_day' && Array.isArray(saved.value.points)) cached = saved
    }
    if (cached?.expires > now()) return cached.value
    if (cached) cache.delete(symbol)
    if (pending.has(symbol)) return pending.get(symbol)
    if (limitedUntil > now()) throw new StockHistoryError('HISTORY_RATE_LIMITED')
    if (pending.size >= 3) throw new StockHistoryError('HISTORY_BUSY')
    const promise = load(symbol).then(value => {
      const entry = { value, expires: now() + cacheTtlMs }
      cache.set(symbol, entry)
      store?.set(symbol, entry)
      if (cache.size > 100) cache.delete(cache.keys().next().value)
      return value
    }).finally(() => pending.delete(symbol))
    pending.set(symbol, promise)
    return promise
  }
}
import { describe, it } from 'mocha'
import assert from 'node:assert/strict'
import { createStockHistory } from '../src/services/stockHistory.js'

const providerReply = (data, status = 200) => ({ status, ok: status === 200, json: async () => data })
const day = (close) => ({ '1. open': '1', '2. high': '2', '3. low': '1', '4. close': close, '5. volume': '10' })
const historyBody = { 'Time Series (Daily)': {
  '2026-11-19': day('147.2500'),
  '2026-11-17': day('145.0000'),
  '2026-11-18': day('146.5000'),
  'not-a-date': day('1.0'),
  '2026-11-16': day('0'),
} }

describe('Stock history service', () => {
  it('returns ordered end-of-day closing prices, drops invalid rows and caches the result', async () => {
    let count = 0
    const now = () => Date.parse('2026-11-20T03:00:00Z')
    const history = createStockHistory({ apiKey: 'fake-key', now, fetchFn: async (url, options) => {
      count++
      assert.equal(url.origin, 'https://www.alphavantage.co')
      assert.equal(url.searchParams.get('function'), 'TIME_SERIES_DAILY')
      assert.equal(url.searchParams.get('symbol'), 'AAPL')
      assert.equal(options.redirect, 'error')
      return providerReply(historyBody)
    } })
    const [first, second] = await Promise.all([history('AAPL'), history('AAPL')])
    assert.deepEqual(first, {
      symbol: 'AAPL', dataTiming: 'end_of_day', fetchedAt: '2026-11-20T03:00:00.000Z',
      points: [
        { date: '2026-11-17', price: 145 },
        { date: '2026-11-18', price: 146.5 },
        { date: '2026-11-19', price: 147.25 },
      ],
    })
    assert.deepEqual(second, first)
    await history('AAPL')
    assert.equal(count, 1)
  })

  it('handles missing configuration, unknown symbols and unusable data', async () => {
    await assert.rejects(createStockHistory({ apiKey: '' })('AAPL'), { code: 'HISTORY_NOT_CONFIGURED' })
    await assert.rejects(createStockHistory({ apiKey: 'fake-key', fetchFn: async () => providerReply({ 'Error Message': 'Invalid API call' }) })('ZZZZ'),
      { code: 'HISTORY_NOT_FOUND' })
    await assert.rejects(createStockHistory({ apiKey: 'fake-key', fetchFn: async () => providerReply({ 'Time Series (Daily)': {} }) })('AAPL'),
      { code: 'HISTORY_UNAVAILABLE' })
    await assert.rejects(createStockHistory({ apiKey: 'fake-key', fetchFn: async () => { throw Error('fake-key') } })('AAPL'),
      { code: 'HISTORY_UNAVAILABLE', message: 'Price history is temporarily unavailable.' })
  })

  it('stops calling the provider after a rate limit notice', async () => {
    let count = 0
    const limited = createStockHistory({ apiKey: 'fake-key', fetchFn: async () => {
      count++
      return providerReply({ Information: '25 requests per day' })
    } })
    await assert.rejects(limited('AAPL'), { code: 'HISTORY_RATE_LIMITED' })
    await assert.rejects(limited('MSFT'), { code: 'HISTORY_RATE_LIMITED' })
    assert.equal(count, 1)
  })

  it('reports transport timeout', async () => {
    const history = createStockHistory({ apiKey: 'fake-key', timeoutMs: 5, fetchFn: async (_url, { signal }) =>
      new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason))) })
    await assert.rejects(history('AAPL'), { code: 'HISTORY_TIMEOUT' })
  })
})

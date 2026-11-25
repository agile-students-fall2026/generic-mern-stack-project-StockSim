import test, { afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { fetchQuote } from '../src/features/market/quotes.js'

const realFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = realFetch })

const quote = { symbol: 'AAPL', price: 180.5, change: 1.2, changePercent: 0.7, tradingDate: '2026-11-23', dataTiming: 'end_of_day' }

function stubFetch(ok, body) {
  const calls = []
  globalThis.fetch = async (url) => {
    calls.push(url)
    return { ok, json: async () => body }
  }
  return calls
}

test('returns an end-of-day quote for the requested symbol', async () => {
  const calls = stubFetch(true, quote)
  const result = await fetchQuote('AAPL')
  assert.equal(result.price, 180.5)
  assert.deepEqual(calls, ['/api/stocks/AAPL/quote'])
})

test('keeps dotted symbols such as AAPL.TRT intact', async () => {
  const calls = stubFetch(true, { ...quote, symbol: 'AAPL.TRT' })
  await fetchQuote('AAPL.TRT')
  assert.deepEqual(calls, ['/api/stocks/AAPL.TRT/quote'])
})

test('shows a clear message for known backend errors', async () => {
  stubFetch(false, { error: { code: 'QUOTE_RATE_LIMITED' } })
  await assert.rejects(fetchQuote('AAPL'), /request limit/)
  stubFetch(false, { error: { code: 'QUOTE_NOT_FOUND' } })
  await assert.rejects(fetchQuote('ZZZZ'), /No end-of-day quote/)
})

test('rejects a wrong symbol, a missing price or live-looking data', async () => {
  stubFetch(true, { ...quote, symbol: 'MSFT' })
  await assert.rejects(fetchQuote('AAPL'), /unavailable/)
  stubFetch(true, { ...quote, price: 0 })
  await assert.rejects(fetchQuote('AAPL'), /unavailable/)
  stubFetch(true, { ...quote, dataTiming: 'realtime' })
  await assert.rejects(fetchQuote('AAPL'), /unavailable/)
})

test('treats a network failure as unavailable but passes aborts through', async () => {
  globalThis.fetch = async () => { throw new TypeError('network down') }
  await assert.rejects(fetchQuote('AAPL'), /unavailable/)
  globalThis.fetch = async () => { throw Object.assign(new Error('aborted'), { name: 'AbortError' }) }
  await assert.rejects(fetchQuote('AAPL'), (error) => error.name === 'AbortError')
})
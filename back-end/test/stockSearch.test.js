import { describe, it } from 'mocha'
import { expect } from 'chai'
import express from 'express'
import request from 'supertest'
import app from '../src/app.js'
import { createStocksRouter } from '../src/routes/stocks.js'
import { createStockSearch, StockSearchError } from '../src/services/stockSearch.js'

const match = { '1. symbol': 'AAPL', '2. name': 'Apple Inc.', '3. type': 'Equity', '4. region': 'United States', '8. currency': 'USD' }
const reply = (body, status = 200) => ({ ok: status === 200, status, json: async () => body })
const provider = options => createStockSearch({ apiKey: 'test-only-key', ...options })
const testApp = search => {
  const instance = express()
  instance.use('/api/stocks', createStocksRouter({ search }))
  return instance
}
const fails = async (operation, code, status) => {
  try {
    await operation()
    expect.fail('Expected search failure')
  } catch (error) {
    expect(error).to.be.instanceOf(StockSearchError)
    expect(error.code).to.equal(code)
    expect(error.status).to.equal(status)
    expect(error.message).not.to.include('test-only-key')
  }
}

describe('Stock search route', () => {
  for (const query of ['', '?q=', '?q=%20%20', '?q=A&q=B', '?q[x]=A', `?q=${'a'.repeat(101)}`, '?q=A%00B']) {
    it(`rejects invalid input ${query.slice(0, 30)} without calling the provider`, async () => {
      let calls = 0
      const response = await request(testApp(async () => { calls++; return [] })).get(`/api/stocks/search${query}`)
      expect(response.status).to.equal(400)
      expect(response.body.error.code).to.equal('INVALID_QUERY')
      expect(calls).to.equal(0)
    })
  }
  for (const q of [' Apple Inc. ', '\tAAPL\n', 'AAPL', 'BRK.B']) {
    it(`accepts company names and tickers: ${q}`, async () => {
      const response = await request(testApp(async query => { expect(query).to.equal(q.trim()); return [] })).get('/api/stocks/search').query({ q })
      expect(response.status).to.equal(200)
      expect(response.body).to.deep.equal({ query: q.trim(), results: [], count: 0 })
    })
  }
  it('is mounted in the real app', async () => {
    expect((await request(app).get('/api/stocks/search')).status).to.equal(400)
  })
  it('returns typed provider errors without details', async () => {
    const response = await request(testApp(async () => { throw new StockSearchError('SEARCH_TIMEOUT', 504) })).get('/api/stocks/search?q=AAPL')
    expect(response.status).to.equal(504)
    expect(response.body.error.code).to.equal('SEARCH_TIMEOUT')
  })
})

describe('Alpha Vantage search adapter (mocked transport only)', () => {
  it('encodes a fixed upstream URL and normalizes, deduplicates and skips invalid items', async () => {
    const search = provider({ fetchFn: async (url, options) => {
      expect(url.origin).to.equal('https://www.alphavantage.co')
      expect(url.searchParams.get('function')).to.equal('SYMBOL_SEARCH')
      expect(url.searchParams.get('keywords')).to.equal('Apple & Co')
      expect(url.searchParams.get('apikey')).to.equal('test-only-key')
      expect(options.redirect).to.equal('error')
      expect(options.signal).to.be.instanceOf(AbortSignal)
      return reply({ bestMatches: [match, match, null, {}, { '1. symbol': 'TEST', '2. name': 'Test' }] })
    } })
    expect(await search('Apple & Co')).to.deep.equal([
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'Equity', region: 'United States', currency: 'USD' },
      { symbol: 'TEST', name: 'Test', type: null, region: null, currency: null },
    ])
  })
  it('returns no matches as an empty array', async () => {
    expect(await provider({ fetchFn: async () => reply({ bestMatches: [] }) })('none')).to.deep.equal([])
  })
  it('fails before network access if the server key is missing', async () => {
    let calls = 0
    const search = provider({ apiKey: '', fetchFn: async () => { calls++; return reply({}) } })
    await fails(() => search('a'), 'SEARCH_NOT_CONFIGURED', 503)
    expect(calls).to.equal(0)
  })
  it('caches case-insensitive queries, expires entries and bounds cache size', async () => {
    let time = 0
    let calls = 0
    const search = provider({ now: () => time, cacheLimit: 1, cacheTtlMs: 100, fetchFn: async () => { calls++; return reply({ bestMatches: [match] }) } })
    await search('Apple'); await search('APPLE')
    expect(calls).to.equal(1)
    time = 101
    await search('Apple')
    expect(calls).to.equal(2)
    await search('Microsoft'); await search('Apple')
    expect(calls).to.equal(4)
  })
  it('coalesces concurrent identical queries', async () => {
    let calls = 0
    const search = provider({ fetchFn: async () => { calls++; return reply({ bestMatches: [match] }) } })
    await Promise.all([search('Apple'), search('APPLE')])
    expect(calls).to.equal(1)
  })
  for (const response of [reply({}, 429), reply({ Note: 'API call frequency exceeded' }), reply({ Information: 'API rate limit is 25 requests per day' })]) {
    it('handles quota errors and avoids immediate upstream retries', async () => {
      let calls = 0
      let time = 0
      const search = provider({ now: () => time, fetchFn: async () => { calls++; return response } })
      await fails(() => search('a'), 'SEARCH_RATE_LIMITED', 503)
      await fails(() => search('b'), 'SEARCH_RATE_LIMITED', 503)
      expect(calls).to.equal(1)
      time = 60001
      await fails(() => search('b'), 'SEARCH_RATE_LIMITED', 503)
      expect(calls).to.equal(2)
    })
  }
  for (const response of [reply({}, 500), reply(null), reply({}), reply({ bestMatches: [null, {}] }), reply({ bestMatches: 'wrong' }), reply({ 'Error Message': 'secret test-only-key' }), reply({ Information: 'Invalid API key test-only-key' })]) {
    it('sanitizes upstream failures and malformed data', async () => {
      await fails(() => provider({ fetchFn: async () => response })('a'), 'SEARCH_UNAVAILABLE', 502)
    })
  }
  it('sanitizes network and JSON errors, and does not cache failures', async () => {
    let calls = 0
    const search = provider({ fetchFn: async () => {
      calls++
      if (calls === 1) throw new Error('URL includes test-only-key')
      if (calls === 2) return { ok: true, json: async () => { throw new Error('test-only-key') } }
      return reply({ bestMatches: [] })
    } })
    await fails(() => search('a'), 'SEARCH_UNAVAILABLE', 502)
    await fails(() => search('a'), 'SEARCH_UNAVAILABLE', 502)
    expect(await search('a')).to.deep.equal([])
  })
  it('aborts slow fetches and returns a safe timeout', async () => {
    const search = provider({ timeoutMs: 5, fetchFn: async (_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new Error('test-only-key')))
    }) })
    await fails(() => search('a'), 'SEARCH_TIMEOUT', 504)
  })
})

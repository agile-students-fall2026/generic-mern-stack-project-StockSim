import { describe, it } from 'mocha'

import assert from 'node:assert/strict'
import express from 'express'
import request from 'supertest'
import app, { createApp } from '../src/app.js'
import { createStocksRouter } from '../src/routes/stocks.js'
import { createWatchlistRouter } from '../src/routes/watchlist.js'
import { createMemoryUserStore } from '../src/stores/memoryUserStore.js'
import { createStockQuote } from '../src/services/stockQuote.js'

const providerReply = (data, status = 200) => ({ status, ok: status === 200, json: async () => data })
const quoteBody = { 'Global Quote': {
  '01. symbol': 'AAPL', '05. price': '147.2500', '07. latest trading day': '2026-11-19',
  '09. change': '-0.55', '10. change percent': '-0.3721%',
} }

describe('Stock quote API', () => {
  it('normalizes tickers, coalesces requests and caches end-of-day quotes with honest timing', async () => {
    let count = 0
    const now = () => Date.parse('2026-11-20T03:00:00Z')
    const quote = createStockQuote({ apiKey: 'fake-key', now, fetchFn: async (url, options) => {
      count++
      assert.equal(url.origin, 'https://www.alphavantage.co')
      assert.equal(url.searchParams.get('function'), 'GLOBAL_QUOTE')
      assert.equal(url.searchParams.get('symbol'), 'AAPL')
      assert.equal(url.searchParams.has('entitlement'), false)
      assert.equal(options.redirect, 'error')
      return providerReply(quoteBody)
    } })
    const instance = express().use('/api/stocks', createStocksRouter({ quote }))
    const [first, second] = await Promise.all([
      request(instance).get('/api/stocks/aapl/quote').expect(200),
      request(instance).get('/api/stocks/AAPL/quote').expect(200),
    ])
    assert.deepEqual(first.body, {
      symbol: 'AAPL', price: 147.25, change: -0.55, changePercent: -0.3721,
      tradingDate: '2026-11-19', quoteTimestamp: null, fetchedAt: '2026-11-20T03:00:00.000Z', dataTiming: 'end_of_day',
    })
    assert.deepEqual(second.body, first.body)
    assert.equal(count, 1)
  })

  it('leaves missing or invalid provider dates null and is mounted in the app', async () => {
    const quote = createStockQuote({ apiKey: 'fake-key', fetchFn: async () => providerReply({
      'Global Quote': { ...quoteBody['Global Quote'], '07. latest trading day': '2026-02-30' },
    }) })
    assert.equal((await quote('AAPL')).tradingDate, null)
    await request(app).get('/api/stocks/a%20b/quote').expect(400)
    await request(app).get('/api/watchlist').expect(503)
  })

  it('handles missing configuration, no data, sanitized failures and quota cooldown', async () => {
    await assert.rejects(createStockQuote({ apiKey: '' })('AAPL'), { code: 'QUOTE_NOT_CONFIGURED' })
    let missingCalls = 0
    const missing = createStockQuote({ apiKey: 'fake-key', fetchFn: async () => {
      missingCalls++
      return providerReply({ 'Global Quote': {} })
    } })
    await assert.rejects(missing('AAPL'), { code: 'QUOTE_NOT_FOUND' })
    await assert.rejects(missing('AAPL'), { code: 'QUOTE_NOT_FOUND' })
    assert.equal(missingCalls, 1)
    await assert.rejects(createStockQuote({ apiKey: 'fake-key', fetchFn: async () => { throw Error('fake-key') } })('AAPL'),
      { code: 'QUOTE_UNAVAILABLE', message: 'Stock quote is temporarily unavailable.' })
    let count = 0
    const limited = createStockQuote({ apiKey: 'fake-key', fetchFn: async () => {
      count++
      return providerReply({ Information: '25 requests per day' })
    } })
    await assert.rejects(limited('AAPL'), { code: 'QUOTE_RATE_LIMITED' })
    await assert.rejects(limited('MSFT'), { code: 'QUOTE_RATE_LIMITED' })
    assert.equal(count, 1)
  })

  it('reports transport timeout', async () => {
    const quote = createStockQuote({ apiKey: 'fake-key', timeoutMs: 5, fetchFn: async (_url, { signal }) =>
      new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason))) })
    await assert.rejects(quote('AAPL'), { code: 'QUOTE_TIMEOUT' })
  })
})

describe('Unmounted watchlist router', () => {
  it('requires trusted dependencies and prevents request-supplied identity', async () => {
    assert.throws(() => createWatchlistRouter({}), TypeError)
    const instance = express().use('/watchlist', createWatchlistRouter({
      getAuthenticatedUserId: () => null, quote: async () => assert.fail('unexpected quote'),
      store: { list: () => assert.fail('unexpected list'), add: () => assert.fail('unexpected add'), remove: () => assert.fail('unexpected remove') },
    }))
    await request(instance).post('/watchlist?userId=alice').set('X-User-Id', 'alice').send({ symbol: 'AAPL' }).expect(401)
  })

  it('adds, deduplicates and removes by session user while retaining symbols without quotes', async () => {
    const records = new Map()
    const list = id => records.get(id) ?? []
    const store = {
      list,
      add(id, symbol) {
        const items = list(id)
        if (items.includes(symbol)) return 'exists'
        records.set(id, [...items, symbol])
        return 'added'
      },
      remove(id, symbol) { records.set(id, list(id).filter(item => item !== symbol)) },
    }
    let trustedSessionId = 'alice'
    const instance = express().use(express.json()).use('/watchlist', createWatchlistRouter({
      getAuthenticatedUserId: () => trustedSessionId, store,
      quote: async symbol => {
        if (symbol === 'MSFT') throw Error('simulated provider failure')
        return { price: 147.25, change: -0.55 }
      },
    }))
    await request(instance).post('/watchlist').send({ symbol: 'aapl', userId: 'bob' }).expect(201)
    await request(instance).post('/watchlist').send({ symbol: 'AAPL' }).expect(200)
    await request(instance).post('/watchlist').send({ symbol: 'MSFT' }).expect(201)
    const { body } = await request(instance).get('/watchlist').expect(200)
    assert.deepEqual(body.items.map(({ symbol, price, change, quoteStatus }) => ({ symbol, price, change, quoteStatus })), [
      { symbol: 'AAPL', price: 147.25, change: -0.55, quoteStatus: 'available' },
      { symbol: 'MSFT', price: null, change: null, quoteStatus: 'unavailable' },
    ])
    trustedSessionId = 'bob'
    assert.deepEqual((await request(instance).get('/watchlist').expect(200)).body.items, [])
    await request(instance).delete('/watchlist/AAPL').expect(204)
    assert.deepEqual(list('alice'), ['AAPL', 'MSFT'])
    trustedSessionId = 'alice'
    await request(instance).delete('/watchlist/aapl').expect(204)
    assert.deepEqual(list('alice'), ['MSFT'])
  })
})

describe('Account watchlist API', () => {
  it('connects login, add/remove, and account isolation without depending on quote availability', async () => {
    const saved = new Map()
    const userStore = createMemoryUserStore()
    const watchlistStore = {
      async list(id) { return [...(saved.get(id) || [])] },
      async add(id, symbol) {
        const list = saved.get(id) || new Set()
        if (list.has(symbol)) return 'exists'
        list.add(symbol)
        saved.set(id, list)
        return 'added'
      },
      async remove(id, symbol) { saved.get(id)?.delete(symbol) },
    }
    const start = () => createApp({ userStore, watchlistStore, quote: async () => { throw new Error('No quote') } })
    const firstApp = start()
    await request(firstApp).get('/api/watchlist').expect(401)
    const logIn = async (api, email, register = true) => {
      const password = 'Example-pass-123!'
      if (register) await api.post('/api/auth/register').send({ name: 'Demo', email, password }).expect(201)
      await api.post('/api/auth/login').send({ email, password }).expect(200)
    }
    const first = request.agent(firstApp)
    await logIn(first, 'first@example.com')
    await first.post('/api/watchlist').set('Origin', 'https://not-stocksim.example').send({ symbol: 'AAPL' }).expect(403)
    await first.post('/api/watchlist').send({ symbol: 'aapl' }).expect(201)
    await first.post('/api/watchlist').send({ symbol: 'AAPL' }).expect(200)
    const restarted = start()
    const other = request.agent(restarted)
    await logIn(other, 'other@example.com')
    await other.get('/api/watchlist').expect(200, { items: [] })
    const reconnected = request.agent(restarted)
    await logIn(reconnected, 'first@example.com', false)
    const listed = await reconnected.get('/api/watchlist').expect(200)
    assert.deepEqual(listed.body.items, [{ symbol: 'AAPL', price: null, change: null, quote: null, quoteStatus: 'unavailable' }])
    await reconnected.delete('/api/watchlist/AAPL').expect(204)
    await reconnected.get('/api/watchlist').expect(200, { items: [] })
  })
})

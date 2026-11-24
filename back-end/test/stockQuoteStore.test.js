import { describe, it } from 'mocha'
import assert from 'node:assert/strict'
import { createStockQuote } from '../src/services/stockQuote.js'

const providerReply = (data) => ({ status: 200, ok: true, json: async () => data })
const body = { 'Global Quote': {
  '01. symbol': 'AAPL', '05. price': '147.2500', '07. latest trading day': '2026-11-19',
  '09. change': '1.2500', '10. change percent': '0.8560%',
} }

function memoryStore() {
  const saved = new Map()
  return { saved, get: (key) => saved.get(key), set: (key, entry) => saved.set(key, entry) }
}

describe('Stock quote saved copy', () => {
  it('reuses a saved quote after a restart without calling the provider', async () => {
    const store = memoryStore()
    const now = () => Date.parse('2026-11-20T03:00:00Z')
    let calls = 0
    const first = createStockQuote({ apiKey: 'fake-key', now, store, fetchFn: async () => { calls++; return providerReply(body) } })
    const quote = await first('AAPL')
    const second = createStockQuote({ apiKey: 'fake-key', now, store, fetchFn: async () => { throw new Error('should not be called') } })
    assert.deepEqual(await second('AAPL'), quote)
    assert.equal(calls, 1)
  })

  it('ignores an expired or invalid saved quote and fetches again', async () => {
    const store = memoryStore()
    const now = () => Date.parse('2026-11-20T03:00:00Z')
    store.saved.set('AAPL', { value: { symbol: 'AAPL', price: 1, dataTiming: 'end_of_day' }, expires: now() - 1 })
    let calls = 0
    const quote = createStockQuote({ apiKey: 'fake-key', now, store, fetchFn: async () => { calls++; return providerReply(body) } })
    assert.equal((await quote('AAPL')).price, 147.25)
    store.saved.set('AAPL', { value: { symbol: 'MSFT', price: 1, dataTiming: 'end_of_day' }, expires: now() + 1000 })
    const other = createStockQuote({ apiKey: 'fake-key', now, store, fetchFn: async () => { calls++; return providerReply(body) } })
    assert.equal((await other('AAPL')).price, 147.25)
    assert.equal(calls, 2)
  })

  it('does not save a missing-symbol result', async () => {
    const store = memoryStore()
    const quote = createStockQuote({ apiKey: 'fake-key', store, fetchFn: async () => providerReply({ 'Global Quote': {} }) })
    await assert.rejects(quote('AAPL'), { code: 'QUOTE_NOT_FOUND' })
    assert.equal(store.saved.size, 0)
  })
})
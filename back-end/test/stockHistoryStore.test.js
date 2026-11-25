import { describe, it } from 'mocha'
import assert from 'node:assert/strict'
import { createStockHistory } from '../src/services/stockHistory.js'

const providerReply = (data) => ({ status: 200, ok: true, json: async () => data })
const day = (close) => ({ '4. close': close })
const body = { 'Time Series (Daily)': { '2026-11-18': day('146.5'), '2026-11-19': day('147.25') } }

function memoryStore() {
  const saved = new Map()
  return { saved, get: (key) => saved.get(key), set: (key, entry) => saved.set(key, entry) }
}

describe('Stock history saved copy', () => {
  it('reuses saved history after a restart without calling the provider', async () => {
    const store = memoryStore()
    const now = () => Date.parse('2026-11-20T03:00:00Z')
    let calls = 0
    const first = createStockHistory({ apiKey: 'fake-key', now, store, fetchFn: async () => { calls++; return providerReply(body) } })
    const history = await first('AAPL')
    const second = createStockHistory({ apiKey: 'fake-key', now, store, fetchFn: async () => { throw new Error('should not be called') } })
    assert.deepEqual(await second('AAPL'), history)
    assert.equal(calls, 1)
  })

  it('fetches again when the saved history is expired or for another symbol', async () => {
    const store = memoryStore()
    const now = () => Date.parse('2026-11-20T03:00:00Z')
    let calls = 0
    const fetchFn = async () => { calls++; return providerReply(body) }
    store.saved.set('AAPL', { value: { symbol: 'AAPL', dataTiming: 'end_of_day', points: [] }, expires: now() - 1 })
    assert.equal((await createStockHistory({ apiKey: 'fake-key', now, store, fetchFn })('AAPL')).points.length, 2)
    store.saved.set('AAPL', { value: { symbol: 'MSFT', dataTiming: 'end_of_day', points: [] }, expires: now() + 1000 })
    assert.equal((await createStockHistory({ apiKey: 'fake-key', now, store, fetchFn })('AAPL')).points.length, 2)
    assert.equal(calls, 2)
  })
})
import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchHistory } from '../src/features/market/history.js'

function reply(body, ok = true) {
  globalThis.fetch = async () => ({ ok, json: async () => body })
}

const good = { symbol: 'AAPL', dataTiming: 'end_of_day', points: [{ date: '2026-11-20', price: 10 }, { date: '2026-11-23', price: 11 }] }

test('returns end-of-day history for the requested symbol', async () => {
  reply(good)
  assert.deepEqual(await fetchHistory('AAPL'), good)
})

test('shows a clear message for known backend errors', async () => {
  reply({ error: { code: 'HISTORY_RATE_LIMITED' } }, false)
  await assert.rejects(fetchHistory('AAPL'), /request limit/)
  reply({ error: { code: 'SOMETHING_ELSE' } }, false)
  await assert.rejects(fetchHistory('AAPL'), /unavailable/)
})

test('rejects a wrong symbol, live-looking data or too few valid points', async () => {
  reply({ ...good, symbol: 'MSFT' })
  await assert.rejects(fetchHistory('AAPL'), /unavailable/)
  reply({ ...good, dataTiming: 'live' })
  await assert.rejects(fetchHistory('AAPL'), /unavailable/)
  reply({ ...good, points: [good.points[0]] })
  await assert.rejects(fetchHistory('AAPL'), /unavailable/)
  reply({ ...good, points: [good.points[0], { date: '2026-11-23', price: 0 }] })
  await assert.rejects(fetchHistory('AAPL'), /unavailable/)
})

test('treats a network failure as unavailable', async () => {
  globalThis.fetch = async () => { throw new TypeError('offline') }
  await assert.rejects(fetchHistory('AAPL'), /unavailable/)
})
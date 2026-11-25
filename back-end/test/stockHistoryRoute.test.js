import { describe, it } from 'mocha'
import assert from 'node:assert/strict'
import express from 'express'
import request from 'supertest'
import app from '../src/app.js'
import { createStocksRouter } from '../src/routes/stocks.js'
import { StockHistoryError } from '../src/services/stockHistory.js'

const reply = { symbol: 'AAPL', dataTiming: 'end_of_day', fetchedAt: '2026-11-20T03:00:00.000Z', points: [{ date: '2026-11-19', price: 147.25 }] }

function serve(history) {
  return express().use('/api/stocks', createStocksRouter({ history }))
}

describe('GET /api/stocks/:symbol/history', () => {
  it('normalizes the symbol and returns the history', async () => {
    const seen = []
    const instance = serve(async (symbol) => { seen.push(symbol); return reply })
    const response = await request(instance).get('/api/stocks/aapl/history').expect(200)
    assert.deepEqual(response.body, reply)
    assert.deepEqual(seen, ['AAPL'])
  })

  it('rejects invalid symbols and is mounted in the app', async () => {
    await request(app).get('/api/stocks/a%20b/history').expect(400)
  })

  it('maps history errors to their status and code', async () => {
    await request(serve(async () => { throw new StockHistoryError('HISTORY_NOT_FOUND') })).get('/api/stocks/ZZZZ/history').expect(404)
    const limited = await request(serve(async () => { throw new StockHistoryError('HISTORY_RATE_LIMITED') })).get('/api/stocks/AAPL/history').expect(503)
    assert.equal(limited.body.error.code, 'HISTORY_RATE_LIMITED')
  })
})
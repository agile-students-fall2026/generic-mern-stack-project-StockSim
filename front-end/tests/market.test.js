import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { URL } from 'node:url'
import { searchStocks, chartHistory } from '../src/features/market/market.js'

test('search matches company or ticker, ignoring case and surrounding space', () => {
  const stocks = [{ symbol: 'NOVA', name: 'Nova Labs' }, { symbol: 'PINE', name: 'Pine Energy' }]
  assert.deepEqual(searchStocks(stocks, '  nova '), [stocks[0]])
  assert.deepEqual(searchStocks(stocks, 'energy'), [stocks[1]])
  assert.deepEqual(searchStocks(stocks, 'missing'), [])
  assert.deepEqual(searchStocks(stocks, ''), stocks)
})

test('chart periods return distinct chronological windows without changing data', () => {
  const stock = { history: Array.from({ length: 14 }, (_, i) => ({ price: i })), intraday: [{ price: 12 }, { price: 13 }] }
  assert.deepEqual(chartHistory(stock, 'Day'), stock.intraday)
  assert.equal(chartHistory(stock, 'Week').length, 7)
  assert.equal(chartHistory(stock, 'Week')[0].price, 7)
  assert.equal(chartHistory(stock, 'All').length, 14)
  assert.equal(stock.history.length, 14)
})

test('trimmed fixture supports every period and preserves the current quote', () => {
  const data = JSON.parse(readFileSync(new URL('../public/mock/market.json', import.meta.url), 'utf8'))
  assert.equal(data.stocks.length, 6)
  for (const stock of data.stocks) {
    assert.equal(stock.history.length, 14)
    assert.equal(stock.intraday.length, 4)
    assert.equal(stock.history.at(-1).price, stock.price)
    assert.equal(stock.intraday.at(-1).price, stock.price)
    assert.equal(stock.history.at(-2).price, stock.previousClose)
    for (const period of ['Day', 'Week', 'All']) {
      const points = chartHistory(stock, period)
      assert.ok(points.every((point) => Number.isFinite(point.price) && point.price > 0))
      assert.deepEqual(points.map((point) => point.date), points.map((point) => point.date).toSorted())
    }
  }
})

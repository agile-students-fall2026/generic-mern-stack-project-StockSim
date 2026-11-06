import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyAccount, executeTrade } from '../src/features/market/practice.js'
import { selectPortfolio, selectTransactions, withinTransactionRange } from '../src/features/market/portfolio.js'

const nova = { symbol: 'NOVA', name: 'Nova Labs', price: 125 }
const date = '2026-11-04T12:00:00.000Z'

test('portfolio starts with the trading account cash and no sample holdings', () => {
  const view = selectPortfolio(emptyAccount, [nova])
  assert.deepEqual(view.holdings, [])
  assert.equal(view.portfolio.cash, 10000)
  assert.equal(view.portfolio.totalValue, 10000)
  assert.equal(view.portfolio.changeAmount, 0)
  assert.deepEqual(selectTransactions(emptyAccount, [nova]), [])
})

test('buy, partial sell, reload and full sell stay consistent across portfolio and history', () => {
  const bought = executeTrade(emptyAccount, nova, 'buy', 2, 'buy-1', date)
  const restored = JSON.parse(JSON.stringify(bought))
  const before = JSON.stringify(restored)
  let view = selectPortfolio(restored, [nova])
  assert.equal(view.portfolio.cash, 9750)
  assert.equal(view.holdingsValue, 250)
  assert.equal(view.portfolio.totalValue, 10000)
  assert.equal(view.holdings[0].symbol, 'NOVA')
  assert.equal(view.holdings[0].averagePrice, 125)
  assert.equal(view.holdings[0].shares, 2)
  assert.equal(JSON.stringify(restored), before)

  const soldOne = executeTrade(restored, nova, 'sell', 1, 'sell-1', date)
  view = selectPortfolio(soldOne, [nova])
  assert.equal(view.portfolio.cash, 9875)
  assert.equal(view.holdingsValue, 125)
  assert.equal(view.holdings[0].shares, 1)
  assert.equal(view.holdings[0].averagePrice, 125)

  const soldAll = executeTrade(soldOne, nova, 'sell', 1, 'sell-2', date)
  view = selectPortfolio(soldAll, [nova])
  assert.deepEqual(view.holdings, [])
  assert.equal(view.portfolio.cash, 10000)
  assert.equal(view.portfolio.totalValue, 10000)
  const transactions = selectTransactions(soldAll, [nova])
  assert.deepEqual(transactions.map((trade) => trade.id), ['sell-2', 'sell-1', 'buy-1'])
  assert.equal(transactions[0].type, 'sell')
  assert.equal(transactions[0].name, 'Nova Labs')
  assert.equal(transactions[0].totalCents, 12500)
})

test('weighted purchase price survives partial sales and total return includes realized gains', () => {
  let account = executeTrade(emptyAccount, { ...nova, price: 10 }, 'buy', 2, 'a', date)
  account = executeTrade(account, { ...nova, price: 20 }, 'buy', 2, 'b', date)
  account = executeTrade(account, { ...nova, price: 30 }, 'sell', 1, 'c', date)
  const view = selectPortfolio(account, [{ ...nova, price: 30 }])
  assert.equal(view.holdings[0].averagePrice, 15)
  assert.equal(view.holdings[0].shares, 3)
  assert.equal(view.portfolio.cash, 9970)
  assert.equal(view.holdingsValue, 90)
  assert.equal(view.portfolio.totalValue, 10060)
  assert.equal(view.portfolio.changeAmount, 60)
  assert.equal(view.portfolio.changePercent, 0.6)
})

test('multiple stocks use current market quotes and omit zero-share positions', () => {
  const pine = { symbol: 'PINE', name: 'Pine Energy', price: 88 }
  let account = executeTrade(emptyAccount, nova, 'buy', 2, 'a', date)
  account = executeTrade(account, pine, 'buy', 3, 'b', date)
  const view = selectPortfolio(account, [nova, { ...pine, price: 90 }])
  assert.equal(view.portfolio.cash, 9486)
  assert.equal(view.holdingsValue, 520)
  assert.equal(view.portfolio.totalValue, 10006)
  assert.equal(view.portfolio.changeAmount, 6)
})

test('missing quotes or missing purchase history never invent a valuation or cost basis', () => {
  const account = { ...emptyAccount, holdings: { MISSING: 2, NOVA: 0 } }
  const missing = selectPortfolio(account, [nova])
  assert.deepEqual(missing.unpricedSymbols, ['MISSING'])
  assert.equal(missing.portfolio.totalValue, null)
  assert.equal(missing.holdingsValue, null)
  assert.equal(missing.holdings[0].averagePrice, null)
  const noLedger = selectPortfolio({ ...emptyAccount, holdings: { NOVA: 2 } }, [nova])
  assert.equal(noLedger.holdings[0].averagePrice, null)
})

test('transaction date filters follow the current date, exclude future dates and retain ALL', () => {
  const now = new Date('2026-12-15T12:00:00Z')
  assert.equal(withinTransactionRange('2026-12-10T12:00:00Z', '1M', now), true)
  assert.equal(withinTransactionRange('2026-11-01T12:00:00Z', '1M', now), false)
  assert.equal(withinTransactionRange('2026-11-01T12:00:00Z', '3M', now), true)
  assert.equal(withinTransactionRange('2026-12-16T12:00:00Z', '1M', now), false)
  assert.equal(withinTransactionRange('invalid', '1M', now), false)
  assert.equal(withinTransactionRange('2026-01-01T12:00:00Z', 'ALL', now), true)
})

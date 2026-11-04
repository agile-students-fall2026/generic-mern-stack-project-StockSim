import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyAccount, validateTrade, executeTrade, isPracticeAccount } from '../src/features/market/practice.js'
const stock = { symbol: 'NOVA', price: 125 }

test('reject invalid quantities, insufficient funds and overselling', () => {
  for (const quantity of ['', '0', '-1', '1.5', 'NaN', 'Infinity', '1e100']) assert.ok(validateTrade(emptyAccount, stock, 'buy', quantity))
  assert.ok(validateTrade(emptyAccount, stock, 'buy', 81))
  assert.ok(validateTrade(emptyAccount, stock, 'sell', 1))
  assert.equal(validateTrade(emptyAccount, stock, 'buy', 80), null)
})
test('buy then sell updates cash and holdings using integer cents', () => {
  const bought = executeTrade(emptyAccount, stock, 'buy', 2, 'a', 'today')
  assert.equal(bought.cashCents, 975000)
  assert.equal(bought.holdings.NOVA, 2)
  const sold = executeTrade(bought, stock, 'sell', 1, 'b', 'today')
  assert.equal(sold.cashCents, 987500)
  assert.equal(sold.holdings.NOVA, 1)
  assert.equal(sold.trades.length, 2)
  assert.equal(emptyAccount.cashCents, 1000000)
})
test('duplicate confirmation cannot debit an order twice', () => {
  const bought = executeTrade(emptyAccount, stock, 'buy', 80, 'a', 'today')
  assert.equal(bought.cashCents, 0)
  assert.deepEqual(executeTrade(bought, stock, 'buy', 80, 'a', 'today'), bought)
})
test('invalid stored accounts are rejected', () => {
  assert.ok(isPracticeAccount(emptyAccount))
  assert.ok(!isPracticeAccount({ ...emptyAccount, cashCents: -1 }))
  assert.ok(!isPracticeAccount({ ...emptyAccount, holdings: { NOVA: -2 } }))
  assert.ok(!isPracticeAccount(null))
  assert.ok(!isPracticeAccount({ ...emptyAccount, trades: [null] }))
  assert.ok(!isPracticeAccount({ ...emptyAccount, holdings: [] }))
})

test('fractional dollar prices do not introduce floating-point balance drift', () => {
  const pennyStock = { symbol: 'SMALL', price: 0.29 }
  const bought = executeTrade(emptyAccount, pennyStock, 'buy', 3, 'c', 'today')
  assert.equal(bought.cashCents, 999913)
  const sold = executeTrade(bought, pennyStock, 'sell', 3, 'd', 'today')
  assert.equal(sold.cashCents, emptyAccount.cashCents)
})

export const emptyAccount = { cashCents: 1000000, holdings: {}, watchlist: [], trades: [] }

export function validateTrade(account, stock, side, quantity) {
  const shares = Number(quantity)
  if (!['buy', 'sell'].includes(side)) return 'Choose buy or sell.'
  if (!Number.isSafeInteger(shares) || shares <= 0) return 'Enter a positive whole number of shares.'
  const priceCents = Math.round(stock.price * 100)
  const total = priceCents * shares
  if (!Number.isSafeInteger(total) || priceCents <= 0) return 'This quote is unavailable.'
  if (side === 'buy' && total > account.cashCents) return 'You do not have enough virtual cash for this purchase.'
  if (side === 'sell' && shares > (account.holdings[stock.symbol] ?? 0)) return 'You cannot sell more shares than you own.'
  return null
}

export function executeTrade(account, stock, side, quantity, id, date) {
  if (account.trades.some((trade) => trade.id === id)) return account
  const error = validateTrade(account, stock, side, quantity)
  if (error) throw new Error(error)
  const shares = Number(quantity)
  const totalCents = Math.round(stock.price * 100) * shares
  const holding = (account.holdings[stock.symbol] ?? 0) + (side === 'buy' ? shares : -shares)
  return {
    ...account,
    cashCents: account.cashCents + (side === 'buy' ? -totalCents : totalCents),
    holdings: { ...account.holdings, [stock.symbol]: holding },
    trades: [{ id, date, symbol: stock.symbol, side, shares, price: stock.price, totalCents }, ...account.trades],
  }
}

export function isPracticeAccount(value) {
  return value && Number.isSafeInteger(value.cashCents) && value.cashCents >= 0
    && value.holdings && typeof value.holdings === 'object' && !Array.isArray(value.holdings)
    && Object.values(value.holdings).every((n) => Number.isSafeInteger(n) && n >= 0)
    && Array.isArray(value.watchlist) && value.watchlist.every((symbol) => typeof symbol === 'string')
    && Array.isArray(value.trades) && value.trades.every((trade) => trade && typeof trade.id === 'string'
      && typeof trade.symbol === 'string' && ['buy', 'sell'].includes(trade.side)
      && Number.isSafeInteger(trade.shares) && trade.shares > 0
      && Number.isSafeInteger(trade.totalCents) && trade.totalCents > 0)
}

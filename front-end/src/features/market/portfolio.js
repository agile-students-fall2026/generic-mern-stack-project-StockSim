import { emptyAccount } from './practice.js'

// Derive display values from the existing account; never seed a second portfolio.
export function selectPortfolio(account, stocks) {
  const costs = {}
  for (const trade of account.trades.toReversed()) {
    const position = costs[trade.symbol] ?? { shares: 0, cents: 0 }
    if (trade.side === 'buy') {
      position.shares += trade.shares
      position.cents += trade.totalCents
    } else if (position.shares >= trade.shares) {
      position.cents = Math.round(position.cents * (position.shares - trade.shares) / position.shares)
      position.shares -= trade.shares
    }
    costs[trade.symbol] = position
  }

  const holdings = Object.entries(account.holdings)
    .filter(([, shares]) => shares > 0)
    .map(([symbol, shares]) => {
      const stock = stocks.find((item) => item.symbol === symbol)
      const cost = costs[symbol]
      return {
        symbol,
        name: stock?.name ?? symbol,
        shares,
        latestPrice: stock?.price ?? null,
        averagePrice: cost?.shares === shares ? cost.cents / shares / 100 : null,
      }
    })
  const unpricedSymbols = holdings.filter((holding) => holding.latestPrice === null).map((holding) => holding.symbol)
  const holdingsCents = holdings.reduce((sum, holding) => sum + holding.shares * Math.round((holding.latestPrice ?? 0) * 100), 0)
  const totalCents = unpricedSymbols.length ? null : account.cashCents + holdingsCents
  return {
    holdings,
    unpricedSymbols,
    holdingsValue: unpricedSymbols.length ? null : holdingsCents / 100,
    portfolio: {
      cash: account.cashCents / 100,
      totalValue: totalCents === null ? null : totalCents / 100,
      changeAmount: totalCents === null ? null : (totalCents - emptyAccount.cashCents) / 100,
      changePercent: totalCents === null ? null : (totalCents - emptyAccount.cashCents) / emptyAccount.cashCents * 100,
    },
  }
}

export function selectTransactions(account, stocks) {
  return account.trades.map((trade) => ({
    ...trade,
    type: trade.side,
    name: stocks.find((stock) => stock.symbol === trade.symbol)?.name ?? trade.symbol,
    executedAt: trade.date ? new Date(trade.date).toLocaleString('en-US') : 'Date unavailable',
  }))
}

export function withinTransactionRange(date, range, now = new Date()) {
  if (range === 'ALL') return true
  const timestamp = new Date(date).getTime()
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - (range === '1M' ? 30 : 90))
  return timestamp >= cutoff.getTime() && timestamp <= now.getTime()
}

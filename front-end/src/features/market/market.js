export const money = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

export function searchStocks(stocks, query) {
  const term = query.trim().toLowerCase()
  return stocks.filter(({ symbol, name }) => `${symbol} ${name}`.toLowerCase().includes(term))
}

export function chartHistory(stock, period) {
  if (period === 'Day') return stock.intraday
  if (period === 'Week') return stock.history.slice(-7)
  return stock.history
}

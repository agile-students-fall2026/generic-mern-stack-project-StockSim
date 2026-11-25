import { usePractice } from './PracticeContext.js'
import useMarket from './useMarket.js'
import useHeldQuotes from './useHeldQuotes.js'
import { selectPortfolio, selectTransactions, withQuotedStocks } from './portfolio.js'

export default function usePortfolio() {
  const { account } = usePractice()
  const market = useMarket()
  const outside = market.loading ? [] : Object.keys(account.holdings)
    .filter((symbol) => account.holdings[symbol] > 0 && !market.stocks.some((stock) => stock.symbol === symbol))
    .sort()
  const quotes = useHeldQuotes(outside)
  const stocks = withQuotedStocks(market.stocks, quotes.prices)
  const values = selectPortfolio(account, stocks)
  const loading = market.loading || quotes.loading
  const reason = Object.values(quotes.errors)[0] ?? ''
  const error = market.error || (!loading && values.unpricedSymbols.length
    ? `Prices are unavailable for ${values.unpricedSymbols.join(', ')}. Your saved holdings have not changed. ${reason}`.trim()
    : null)
  return { ...market, loading, ...values, error, transactions: selectTransactions(account, stocks) }
}
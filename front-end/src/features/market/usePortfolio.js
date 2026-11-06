import { usePractice } from './PracticeContext.js'
import useMarket from './useMarket.js'
import { selectPortfolio, selectTransactions } from './portfolio.js'

export default function usePortfolio() {
  const { account } = usePractice()
  const market = useMarket()
  const values = selectPortfolio(account, market.stocks)
  const error = market.error || (!market.loading && values.unpricedSymbols.length
    ? `Prices are unavailable for ${values.unpricedSymbols.join(', ')}. Your saved holdings have not changed.`
    : null)
  return { ...market, ...values, error, transactions: selectTransactions(account, market.stocks) }
}

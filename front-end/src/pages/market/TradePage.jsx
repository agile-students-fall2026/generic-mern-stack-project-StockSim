import { Link, useParams } from 'react-router'
import useMarket from '../../features/market/useMarket.js'
import useQuote from '../../features/market/useQuote.js'
import MarketState from '../../features/market/MarketState.jsx'
import TradeTicket from '../../features/market/TradeTicket.jsx'

export default function TradePage({ side }) {
  const params = useParams()
  const symbol = params.symbol.toUpperCase()
  const market = useMarket()
  const practiceStock = market.stocks.find((item) => item.symbol === symbol)
  const live = useQuote(symbol, !market.loading && !practiceStock)
  const stock = practiceStock ?? (live.quote ? { symbol, name: symbol, price: live.quote.price, live: true } : null)
  const detailsPath = practiceStock ? `/market/${symbol}` : `/market/quotes/${symbol}`
  return <>
    <Link to={detailsPath} className="mb-6 inline-block text-sm font-semibold">← Back to stock details</Link>
    {market.loading && <MarketState {...market} />}
    {!market.loading && (stock
      ? <TradeTicket key={`${symbol}-${side}`} stock={stock} side={side} />
      : live.loading
        ? <p role="status">Loading end-of-day price…</p>
        : <><h1 tabIndex={-1} className="text-3xl font-semibold">Investment unavailable</h1><p className="mt-3 text-muted">{live.error}</p><button onClick={live.retry} className="mt-4 rounded-xl border border-border px-5 py-3 font-semibold">Try again</button></>)}
  </>
}
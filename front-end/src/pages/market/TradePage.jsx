import { Link, useParams } from 'react-router'
import useMarket from '../../features/market/useMarket.js'
import MarketState from '../../features/market/MarketState.jsx'
import TradeTicket from '../../features/market/TradeTicket.jsx'

export default function TradePage({ side }) {
  const { symbol } = useParams()
  const market = useMarket()
  const stock = market.stocks.find((item) => item.symbol === symbol.toUpperCase())
  return <><Link to={`/market/${symbol}`} className="mb-6 inline-block text-sm font-semibold">← Back to stock details</Link><MarketState {...market} />{!market.loading && !market.error && (stock ? <TradeTicket key={`${symbol}-${side}`} stock={stock} side={side} /> : <h1 tabIndex={-1} className="text-3xl font-semibold">Investment unavailable</h1>)}</>
}

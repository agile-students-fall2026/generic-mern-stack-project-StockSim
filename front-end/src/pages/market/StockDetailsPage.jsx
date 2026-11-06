import { Link, useParams } from 'react-router'
import useMarket from '../../features/market/useMarket.js'
import MarketState from '../../features/market/MarketState.jsx'
import PriceChart from '../../features/market/PriceChart.jsx'
import { money } from '../../features/market/market.js'
import WatchButton from '../../features/market/WatchButton.jsx'
import usePageHeading from '../../features/market/usePageHeading.js'

export default function StockDetailsPage() {
  const { symbol } = useParams()
  const market = useMarket()
  const stock = market.stocks.find((item) => item.symbol === symbol.toUpperCase())
  usePageHeading(market.loading ? null : stock?.name ?? 'Investment unavailable')
  return <>
    <Link to="/market" className="mb-6 inline-block text-sm font-semibold">← Back to Market</Link>
    <MarketState {...market} />
    {!market.loading && !market.error && (stock ? <>
      <p className="mb-3 text-xs font-semibold tracking-wider text-muted uppercase">{stock.symbol} · {stock.sector} · Practice investment</p>
      <h1 tabIndex={-1} className="text-4xl font-semibold tracking-tight">{stock.name}</h1>
      <p className="mt-6 text-4xl font-semibold tabular-nums">{money(stock.price)}</p>
      <p className="mt-2 mb-8 text-muted">Previous close {money(stock.previousClose)} · USD · Simulated quote</p>
      <PriceChart key={stock.symbol} stock={stock} />
      <div className="mt-6"><WatchButton symbol={stock.symbol} /></div>
      <div className="mt-4 grid grid-cols-2 gap-3"><Link to={`/market/${stock.symbol}/buy`} className="rounded-xl bg-accent px-5 py-4 text-center font-semibold no-underline">Buy</Link><Link to={`/market/${stock.symbol}/sell`} className="rounded-xl border border-border px-5 py-4 text-center font-semibold no-underline">Sell</Link></div>
      <section className="mt-8"><h2 className="text-xl font-semibold">About {stock.name}</h2><p className="mt-3 max-w-prose leading-7 text-muted">{stock.description}</p></section>
    </> : <><h1 tabIndex={-1} className="text-3xl font-semibold">Investment unavailable</h1><p className="mt-4 text-muted">This ticker is not in the practice market. Return to Market to choose an investment.</p></>)}
  </>
}

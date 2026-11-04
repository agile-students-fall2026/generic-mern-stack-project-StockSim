import { Link } from 'react-router'
import PageIntro from '../../components/layout/PageIntro.jsx'
import { usePractice } from '../../features/market/PracticeContext.js'
import useMarket from '../../features/market/useMarket.js'
import MarketState from '../../features/market/MarketState.jsx'
import StockList from '../../features/market/StockList.jsx'
import WatchButton from '../../features/market/WatchButton.jsx'

export default function WatchlistPage() {
  const { account } = usePractice()
  const market = useMarket()
  const stocks = market.stocks.filter((stock) => account.watchlist.includes(stock.symbol))
  return <>
    <Link to="/market" className="mb-6 inline-block text-sm font-semibold">← Back to Market</Link>
    <PageIntro eyebrow="Your practice account" title="Watchlist" description="Keep the investments you are curious about in one place." />
    <p className="mb-6 text-sm text-muted">Saved in this browser for this demo account.</p>
    <MarketState {...market} />
    {!market.loading && !market.error && (stocks.length ? <ul className="space-y-4">{stocks.map((stock) => <li key={stock.symbol} className="rounded-2xl border border-border p-4"><StockList stocks={[stock]} /><WatchButton symbol={stock.symbol} /></li>)}</ul> : <div className="rounded-2xl bg-hover p-8"><h2 className="text-xl font-semibold">Your watchlist is empty</h2><p className="mt-3 text-muted">Find an investment and add it from its details page.</p></div>)}
    <Link to="/market" className="mt-6 inline-block rounded-xl bg-accent px-5 py-3 font-semibold no-underline">Find investments</Link>
  </>
}

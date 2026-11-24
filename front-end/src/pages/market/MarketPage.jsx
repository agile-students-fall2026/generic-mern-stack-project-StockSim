import { Link } from 'react-router'
import PageIntro from '../../components/layout/PageIntro.jsx'
import useMarket from '../../features/market/useMarket.js'
import MarketState from '../../features/market/MarketState.jsx'
import StockList from '../../features/market/StockList.jsx'
import MarketSearch from '../../features/market/MarketSearch.jsx'

function MarketPage() {
  const market = useMarket()
  return <>
    <PageIntro eyebrow="Practice account · Simulated prices" title="Market" description="Find your next investment. Explore companies and build confidence with virtual money." />
    <Link to="/market/watchlist" className="mb-6 inline-block rounded-xl border border-border px-5 py-3 font-semibold no-underline">View watchlist →</Link>
    <MarketSearch />
    <h2 className="mb-2 text-xl font-semibold">Practice investments</h2>
    <p className="mb-4 text-sm text-muted">Fictional companies with made-up prices for practice. Stocks from search use real end-of-day prices.</p>
    <MarketState {...market} />
    {!market.loading && !market.error && <section aria-label="Practice investments"><StockList stocks={market.stocks} /></section>}
  </>
}

export default MarketPage

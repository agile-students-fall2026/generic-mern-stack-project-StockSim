import { useState } from 'react'
import { Link } from 'react-router'
import PageIntro from '../../components/layout/PageIntro.jsx'
import useMarket from '../../features/market/useMarket.js'
import MarketState from '../../features/market/MarketState.jsx'
import StockList from '../../features/market/StockList.jsx'
import { searchStocks } from '../../features/market/market.js'

function MarketPage() {
  const market = useMarket()
  const [query, setQuery] = useState('')
  const results = searchStocks(market.stocks, query)
  return <>
    <PageIntro eyebrow="Practice account · Simulated prices" title="Market" description="Find your next investment. Explore companies and build confidence with virtual money." />
    <Link to="/market/watchlist" className="mb-6 inline-block rounded-xl border border-border px-5 py-3 font-semibold no-underline">View watchlist →</Link>
    <label htmlFor="market-search" className="mb-2 block text-sm font-semibold">Search by company or ticker</label>
    <input id="market-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try Nova or NOVA" className="mb-6 min-h-13 w-full rounded-xl border border-border bg-hover px-4" />
    <MarketState {...market} />
    {!market.loading && !market.error && <section aria-label="Investments"><p role="status" className="mb-2 text-sm text-muted">{results.length} {results.length === 1 ? 'investment' : 'investments'}{query.trim() ? ' found' : ' to explore'}</p>{results.length ? <StockList stocks={results} /> : <div className="rounded-2xl bg-hover p-8"><h2 className="font-semibold">No investments found</h2><p className="mt-2 text-muted">Try a different company name or ticker.</p><button onClick={() => setQuery('')} className="mt-4 rounded-xl bg-accent px-5 py-3 font-semibold">Clear search</button></div>}</section>}
  </>
}

export default MarketPage

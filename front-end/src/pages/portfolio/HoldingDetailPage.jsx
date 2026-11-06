import { Link, useParams } from 'react-router'
import BackLink from '../../components/ui/BackLink.jsx'
import { formatMoney, formatSignedMoney, formatSignedPercent } from '../../components/ui/format.js'
import usePortfolio from '../../features/market/usePortfolio.js'
import MarketState from '../../features/market/MarketState.jsx'
import usePageHeading from '../../features/market/usePageHeading.js'

function HoldingDetailPage() {
  const { symbol } = useParams()
  const state = usePortfolio()
  const holding = state.holdings.find((h) => h.symbol === symbol.toUpperCase())
  usePageHeading(state.loading ? null : holding?.name ?? 'Holding not found')

  if (state.loading || state.error) return <><BackLink /><MarketState {...state} /></>

  if (!holding) {
    return (
      <>
        <BackLink />
        <h1 tabIndex={-1} className="text-3xl font-semibold tracking-[-0.04em]">Holding not found</h1>
        <p className="mt-3 text-muted">This holding is not in the practice portfolio.</p>
      </>
    )
  }

  const value = holding.shares * holding.latestPrice
  const gain = holding.averagePrice === null ? null : (holding.latestPrice - holding.averagePrice) * holding.shares
  const gainPercent = holding.averagePrice ? ((holding.latestPrice - holding.averagePrice) / holding.averagePrice) * 100 : null

  return (
    <>
      <BackLink />
      <p className="text-sm font-[650] tracking-[0.08em] text-muted uppercase">{holding.symbol}</p>
      <h1 tabIndex={-1} className="mt-2 text-4xl font-semibold tracking-[-0.04em]">{holding.name}</h1>

      <p className="mt-6 text-sm font-[650] tracking-[0.08em] text-muted uppercase">Holding value</p>
      <p className="mt-2 text-4xl font-semibold tracking-[-0.04em]">{formatMoney(value)}</p>

      <dl className="mt-6 flex flex-col gap-3">
        <div className="flex items-baseline justify-between rounded-xl border border-border p-4">
          <dt className="text-muted">Shares owned</dt>
          <dd className="font-[650]">{holding.shares}</dd>
        </div>
        <div className="flex items-baseline justify-between rounded-xl border border-border p-4">
          <dt className="text-muted">Average purchase price</dt>
          <dd className="font-[650]">{holding.averagePrice === null ? 'Unavailable' : formatMoney(holding.averagePrice)}</dd>
        </div>
        <div className="flex items-baseline justify-between rounded-xl border border-border p-4">
          <dt className="text-muted">Latest price</dt>
          <dd className="font-[650]">{formatMoney(holding.latestPrice)}</dd>
        </div>
        <div className="flex items-baseline justify-between rounded-xl border border-border p-4">
          <dt className="text-muted">Gain / loss</dt>
          <dd className="font-[650]">
            {gain === null || gainPercent === null ? 'Unavailable' : `${formatSignedMoney(gain)} (${formatSignedPercent(gainPercent)})`}
          </dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-col gap-3">
        <Link
          to={`/market/${holding.symbol}/buy`}
          className="inline-flex min-h-12 items-center justify-center rounded-[2rem] bg-accent px-6 py-3.5 font-[650] text-ink no-underline hover:bg-accent-hover"
        >
          Buy
        </Link>
        <Link
          to={`/market/${holding.symbol}/sell`}
          className="inline-flex min-h-12 items-center justify-center rounded-[2rem] border border-border px-6 py-3.5 font-[650] text-ink no-underline hover:bg-hover"
        >
          Sell
        </Link>
        <Link
          to={`/market/${holding.symbol}`}
          className="inline-flex min-h-12 items-center justify-center rounded-[2rem] border border-border px-6 py-3.5 font-[650] text-ink no-underline hover:bg-hover"
        >
          Stock details
        </Link>
      </div>
    </>
  )
}

export default HoldingDetailPage

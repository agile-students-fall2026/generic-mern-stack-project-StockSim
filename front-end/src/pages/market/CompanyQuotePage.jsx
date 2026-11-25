import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import SaveCompanyButton from '../../features/market/SaveCompanyButton.jsx'
import PageIntro from '../../components/layout/PageIntro.jsx'
import PriceChart from '../../features/market/PriceChart.jsx'
import useHistory from '../../features/market/useHistory.js'

const messages = {
  QUOTE_NOT_FOUND: 'No end-of-day quote was found for this ticker.',
  QUOTE_NOT_CONFIGURED: 'The quote service is not configured.',
  QUOTE_RATE_LIMITED: 'The quote provider has reached its request limit. Try again later.',
  QUOTE_TIMEOUT: 'The quote request timed out. Try again.',
}

const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 })
const signed = new Intl.NumberFormat('en-US', { maximumFractionDigits: 6, signDisplay: 'exceptZero' })

function CompanyQuote({ symbol }) {
  const [state, setState] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const history = useHistory(symbol)

  useEffect(() => {
    const controller = new AbortController()
    const unavailable = 'The end-of-day quote is unavailable. Try again later.'
    async function load() {
      try {
        const response = await fetch(`/api/stocks/${encodeURIComponent(symbol)}/quote`, { signal: controller.signal })
        const data = await response.json()
        if (controller.signal.aborted) return
        if (!response.ok) {
          setState({ status: 'error', message: Object.hasOwn(messages, data?.error?.code) ? messages[data.error.code] : unavailable })
          return
        }
        if (data?.symbol !== symbol || data.dataTiming !== 'end_of_day' || !Number.isFinite(data.price) || !Number.isFinite(data.change)) {
          setState({ status: 'error', message: unavailable })
          return
        }
        setState({ status: 'ready', data })
      } catch {
        if (!controller.signal.aborted) setState({ status: 'error', message: unavailable })
      }
    }
    load()
    return () => controller.abort()
  }, [symbol, attempt])

  return <>
    <PageIntro eyebrow="Market · End-of-day quote" title={symbol} description="Latest available end-of-day data, not a live price. Practice trades use this price." />
    <Link to="/market" className="mb-6 inline-block font-semibold">Back to Market</Link>
    <SaveCompanyButton symbol={symbol} />
    {state.status === 'loading' && <p role="status">Loading {symbol} quote…</p>}
    {state.status === 'error' && <div>
      <p role="alert">{state.message}</p>
      <button type="button" className="mt-4 rounded-xl border border-border px-4 py-3" onClick={() => {
        setState({ status: 'loading' })
        setAttempt(value => value + 1)
      }}>Try again</button>
    </div>}
    {state.status === 'ready' && history.loading && <p role="status" className="mt-6">Loading price history…</p>}
    {state.status === 'ready' && history.error && <p role="status" className="mt-6">{history.error}</p>}
    {state.status === 'ready' && history.points && <div className="mt-6"><PriceChart real stock={{ name: symbol, history: history.points }} /></div>}
    {state.status === 'ready' && <dl className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2">
      <div><dt>Price</dt><dd className="font-semibold">{number.format(state.data.price)}</dd></div>
      <div><dt>Daily change</dt><dd className="font-semibold">{signed.format(state.data.change)}</dd></div>
      <div><dt>Daily change (%)</dt><dd className="font-semibold">{Number.isFinite(state.data.changePercent) ? `${signed.format(state.data.changePercent)}%` : 'Not provided'}</dd></div>
      <div><dt>Trading date</dt><dd className="font-semibold">{state.data.tradingDate || 'Not provided'}</dd></div>
    </dl>}
    {state.status === 'ready' && <div className="mt-6 grid grid-cols-2 gap-3">
      <Link to={`/market/${encodeURIComponent(symbol)}/buy`} className="rounded-xl bg-accent px-5 py-4 text-center font-semibold no-underline">Buy</Link>
      <Link to={`/market/${encodeURIComponent(symbol)}/sell`} className="rounded-xl border border-border px-5 py-4 text-center font-semibold no-underline">Sell</Link>
    </div>}
  </>
}

export default function CompanyQuotePage() {
  const { symbol = '' } = useParams()
  const ticker = symbol.trim().toUpperCase()
  if (!/^[A-Z0-9][A-Z0-9.^-]{0,23}$/.test(ticker)) {
    return <>
      <PageIntro eyebrow="Market" title="Quote unavailable" description="The stock ticker is invalid." />
      <Link to="/market" className="font-semibold">Back to Market</Link>
    </>
  }
  return <CompanyQuote key={ticker} symbol={ticker} />
}

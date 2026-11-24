import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { watchlistRequest } from './accountWatchlist.js'

const price = new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 })
const change = new Intl.NumberFormat('en-US', { signDisplay: 'exceptZero', maximumFractionDigits: 6 })

export default function AccountWatchlist() {
  const [state, setState] = useState({ loading: true, items: [] })
  const [attempt, setAttempt] = useState(0)
  const [removing, setRemoving] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    watchlistRequest('', { signal: controller.signal })
      .then(({ items }) => {
        if (!controller.signal.aborted) setState({ loading: false, items })
      })
      .catch(failure => {
        if (!controller.signal.aborted) setState({ loading: false, items: [], error: failure.message })
      })
    return () => controller.abort()
  }, [attempt])

  async function remove(symbol) {
    setRemoving(symbol)
    setError('')
    try {
      await watchlistRequest(`/${encodeURIComponent(symbol)}`, { method: 'DELETE' })
      setState(current => ({ ...current, items: current.items.filter(item => item.symbol !== symbol) }))
    } catch (failure) {
      setError(failure.message)
    } finally {
      setRemoving(null)
    }
  }

  return <section aria-labelledby="account-watchlist" className="mb-8">
    <h2 id="account-watchlist" className="mb-2 text-xl font-semibold">Account watchlist</h2>
    <p className="mb-4 text-sm text-muted">Saved to your account. Prices and changes are end-of-day, not live.</p>
    {state.loading && <p role="status">Loading watchlist…</p>}
    {state.error && <div>
      <p role="alert">{state.error}</p>
      <button type="button" className="mt-2 font-semibold" onClick={() => {
        setState({ loading: true, items: [] })
        setAttempt(value => value + 1)
      }}>Try again</button>
    </div>}
    {error && <p role="alert">{error}</p>}
    {!state.loading && !state.error && (state.items.length ? <ul className="space-y-3">
      {state.items.map(item => <li key={item.symbol} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
        <div>
          <Link className="font-semibold" to={`/market/quotes/${encodeURIComponent(item.symbol)}`}>{item.symbol}</Link>
          <p className="text-sm text-muted">{item.quoteStatus === 'available' && Number.isFinite(item.price) && Number.isFinite(item.change)
            ? `Closing price ${price.format(item.price)} · Daily change ${change.format(item.change)}`
            : 'Quote currently unavailable'}</p>
        </div>
        <button type="button" className="rounded-xl border border-border px-4 py-2" disabled={removing !== null} onClick={() => remove(item.symbol)}>
          {removing === item.symbol ? `Removing ${item.symbol}…` : `Remove ${item.symbol}`}
        </button>
      </li>)}
    </ul> : <p>Search for a company in Market and save it from its quote page.</p>)}
  </section>
}

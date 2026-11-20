import { useEffect, useRef, useState } from 'react'

const errorMessages = {
  INVALID_QUERY: 'Enter a company name or ticker of up to 100 characters.',
  SEARCH_NOT_CONFIGURED: 'Company search is not configured on the server yet. Practice investments below are still available.',
  SEARCH_RATE_LIMITED: 'Company search has reached its provider limit. Try again later.',
  SEARCH_TIMEOUT: 'Company search timed out. Try again.',
}

export default function MarketSearch() {
  const [query, setQuery] = useState('')
  const [state, setState] = useState({ status: 'idle', results: [], query: '' })
  const active = useRef(null)
  useEffect(() => () => active.current?.abort(), [])

  function clearSearch(value = '') {
    active.current?.abort()
    active.current = null
    setQuery(value)
    setState({ status: 'idle', results: [], query: '' })
  }

  async function submit(event) {
    event.preventDefault()
    active.current?.abort()
    active.current = null
    const term = query.trim()
    if (!term || term.length > 100 || [...term].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) {
      setState({ status: 'error', results: [], query: term, message: errorMessages.INVALID_QUERY })
      return
    }
    const controller = new AbortController()
    active.current = controller
    const timer = setTimeout(() => controller.abort(), 12000)
    setState({ status: 'loading', results: [], query: term })
    try {
      const response = await fetch(`/api/stocks/search?${new URLSearchParams({ q: term })}`, { signal: controller.signal })
      const data = await response.json()
      if (active.current !== controller) return
      if (!response.ok) {
        setState({ status: 'error', results: [], query: term, message: errorMessages[data?.error?.code] || 'Company search is unavailable. Try again later.' })
        return
      }
      if (!Array.isArray(data.results) || !data.results.every(result => typeof result?.symbol === 'string' && typeof result?.name === 'string')) {
        throw new Error('Invalid search response')
      }
      setState({ status: 'success', results: data.results, query: term })
    } catch {
      if (active.current !== controller) return
      setState({ status: 'error', results: [], query: term, message: controller.signal.aborted ? errorMessages.SEARCH_TIMEOUT : 'Cannot reach company search. Try again later.' })
    } finally {
      clearTimeout(timer)
      if (active.current === controller) active.current = null
    }
  }

  return <section aria-label="Company search" className="mb-8">
    <form onSubmit={submit}>
      <label htmlFor="market-search" className="mb-2 block text-sm font-semibold">Search by company or ticker</label>
      <div className="flex flex-wrap gap-2">
        <input id="market-search" type="search" value={query} onChange={event => clearSearch(event.target.value)} maxLength={100} placeholder="Try Apple or AAPL" aria-describedby="search-help" className="min-h-13 min-w-0 flex-1 rounded-xl border border-border bg-hover px-4" />
        <button type="submit" disabled={state.status === 'loading'} className="rounded-xl bg-accent px-5 py-3 font-semibold disabled:opacity-50">Search</button>
        <button type="button" onClick={() => clearSearch()} className="rounded-xl border border-border px-4 py-3">Clear</button>
      </div>
      <p id="search-help" className="mt-2 text-sm text-muted">Press Enter or Search to look up companies. Results do not include prices or trading.</p>
    </form>
    {state.status === 'loading' && <p role="status" className="mt-4">Searching for {state.query}…</p>}
    {state.status === 'error' && <p role="alert" className="mt-4">{state.message}</p>}
    {state.status === 'success' && <div className="mt-4">
      <p role="status" className="mb-2 text-sm text-muted">{state.results.length ? `${state.results.length} results for ${state.query}` : `No companies found for ${state.query}. Try another name or ticker.`}</p>
      <ul className="divide-y divide-border rounded-xl border border-border">
        {state.results.map((result, index) => <li key={`${result.symbol}-${index}`} className="px-4 py-3">
          <span className="font-semibold">{result.symbol}</span><span className="ml-3">{result.name}</span>
        </li>)}
      </ul>
    </div>}
  </section>
}

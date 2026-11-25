import { useEffect, useState } from 'react'
import { fetchQuote } from './quotes.js'

export default function useQuote(symbol, enabled = true) {
  const [state, setState] = useState({ symbol: null, quote: null, error: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!enabled) return undefined
    const controller = new AbortController()
    fetchQuote(symbol, controller.signal)
      .then((quote) => setState({ symbol, quote, error: null }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ symbol, quote: null, error: error.message })
      })
    return () => controller.abort()
  }, [symbol, enabled, attempt])

  function retry() {
    setState({ symbol: null, quote: null, error: null })
    setAttempt((value) => value + 1)
  }

  if (!enabled) return { loading: false, error: null, quote: null, retry }
  const current = state.symbol === symbol
  return { loading: !current, error: current ? state.error : null, quote: current ? state.quote : null, retry }
}
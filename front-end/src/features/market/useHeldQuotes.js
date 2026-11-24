import { useEffect, useState } from 'react'
import { fetchQuote } from './quotes.js'

export default function useHeldQuotes(symbols) {
  const key = symbols.join(',')
  const [state, setState] = useState({ key: '', prices: {}, errors: {} })

  useEffect(() => {
    if (!key) return undefined
    const controller = new AbortController()
    async function load() {
      const prices = {}
      const errors = {}
      for (const symbol of key.split(',')) {
        try {
          prices[symbol] = (await fetchQuote(symbol, controller.signal)).price
        } catch (error) {
          if (error.name === 'AbortError') return
          errors[symbol] = error.message
        }
      }
      setState({ key, prices, errors })
    }
    load()
    return () => controller.abort()
  }, [key])

  const ready = state.key === key
  return { loading: Boolean(key) && !ready, prices: ready ? state.prices : {}, errors: ready ? state.errors : {} }
}
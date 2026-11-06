import { useEffect, useState } from 'react'

export default function useMarket() {
  const [state, setState] = useState({ loading: true, stocks: [], error: null })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    fetch('/mock/market.json', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Market data could not be loaded.')
        return response.json()
      })
      .then((data) => {
        if (!Array.isArray(data.stocks) || !data.stocks.length) throw new Error('Market data is unavailable.')
        setState({ ...data, loading: false, error: null })
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ loading: false, stocks: [], error: error.message })
      })
    return () => controller.abort()
  }, [attempt])
  return { ...state, retry: () => { setState({ loading: true, stocks: [], error: null }); setAttempt((value) => value + 1) } }
}

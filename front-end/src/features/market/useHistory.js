import { useEffect, useState } from 'react'
import { fetchHistory } from './history.js'

export default function useHistory(symbol) {
  const [state, setState] = useState({ symbol: null, points: null, error: null })

  useEffect(() => {
    const controller = new AbortController()
    fetchHistory(symbol, controller.signal)
      .then((data) => setState({ symbol, points: data.points, error: null }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ symbol, points: null, error: error.message })
      })
    return () => controller.abort()
  }, [symbol])

  const current = state.symbol === symbol
  return { loading: !current, error: current ? state.error : null, points: current ? state.points : null }
}
import { useEffect } from 'react'

export default function usePageHeading(title) {
  useEffect(() => {
    if (!title) return
    document.title = `${title} | StockSim`
    document.querySelector('main h1')?.focus({ preventScroll: true })
  }, [title])
}

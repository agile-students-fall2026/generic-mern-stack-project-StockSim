import { useState } from 'react'
import { chartHistory, money } from './market.js'

export default function PriceChart({ stock }) {
  const [period, setPeriod] = useState('Day')
  const [selected, setSelected] = useState(null)
  const points = chartHistory(stock, period)
  const min = Math.min(...points.map((point) => point.price))
  const max = Math.max(...points.map((point) => point.price))
  const coordinates = points.map((point, i) => `${10 + i / Math.max(1, points.length - 1) * 580},${150 - (point.price - min) / (max - min || 1) * 130}`).join(' ')
  const point = points[Math.min(selected ?? points.length - 1, points.length - 1)]
  return <section aria-label="Historical practice prices" className="rounded-2xl border border-border p-4 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Price history</h2><div className="flex flex-wrap gap-1" aria-label="Chart period">{['Day', 'Week', 'All'].map((value) => <button key={value} aria-pressed={period === value} onClick={() => { setPeriod(value); setSelected(null) }} className={`min-h-11 rounded-lg px-3 text-sm font-semibold ${period === value ? 'bg-selected' : 'hover:bg-hover'}`}>{value}</button>)}</div></div>
    <svg viewBox="0 0 600 170" role="img" aria-label={`${stock.name} ${period} simulated price history, low ${money(min)}, high ${money(max)}`} onClick={(event) => {
      const bounds = event.currentTarget.getBoundingClientRect()
      const position = ((event.clientX - bounds.left) / bounds.width * 600 - 10) / 580
      setSelected(Math.round(Math.max(0, Math.min(1, position)) * (points.length - 1)))
    }} className="my-4 w-full cursor-crosshair text-focus"><polyline fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" points={coordinates} /></svg>
    <label className="block text-sm text-muted" htmlFor="history-point">Inspect historical price</label>
    <input id="history-point" type="range" min="0" max={points.length - 1} value={selected ?? points.length - 1} onChange={(event) => setSelected(Number(event.target.value))} className="my-3 w-full accent-lime-700" />
    <p aria-live="polite" className="text-sm tabular-nums">{point.date} · <strong>{money(point.price)}</strong></p>
    <p className="mt-3 text-xs text-muted">Generated practice history. Day shows 4 intraday samples; Week shows 7 days; All shows the 14 available days. Not live prices.</p>
  </section>
}

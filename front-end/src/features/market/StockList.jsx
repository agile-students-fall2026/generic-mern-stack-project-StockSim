import { Link } from 'react-router'
import { money } from './market.js'

export default function StockList({ stocks }) {
  return <ul className="divide-y divide-border">
    {stocks.map((stock) => {
      const change = (stock.price - stock.previousClose) / stock.previousClose * 100
      return <li key={stock.symbol}><Link to={`/market/${stock.symbol}`} className="flex items-center justify-between gap-3 rounded-xl px-3 py-5 no-underline hover:bg-hover">
        <span className="flex min-w-0 items-center gap-3"><span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-selected text-xs font-bold">{stock.symbol.slice(0, 2)}</span><span><span className="block font-semibold">{stock.symbol}</span><span className="text-sm text-muted">{stock.name}</span></span></span>
        <span className="shrink-0 text-right tabular-nums"><span className="block font-semibold">{money(stock.price)}</span><span className={`text-sm ${change >= 0 ? 'text-green-800' : 'text-red-700'}`}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span></span>
      </Link></li>
    })}
  </ul>
}

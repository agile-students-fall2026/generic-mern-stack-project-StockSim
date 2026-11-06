import { useState } from 'react'
import { usePractice } from './PracticeContext.js'

export default function WatchButton({ symbol }) {
  const { account, toggleWatch } = usePractice()
  const [confirm, setConfirm] = useState(false)
  const saved = account.watchlist.includes(symbol)
  return <div>
    {confirm ? <div className="rounded-xl border border-border p-4"><p className="mb-3 font-semibold">Remove {symbol} from your watchlist?</p><div className="flex flex-wrap gap-3"><button onClick={() => { toggleWatch(symbol); setConfirm(false) }} className="rounded-xl bg-ink px-4 py-3 text-white">Confirm removal</button><button onClick={() => setConfirm(false)} className="rounded-xl border border-border px-4 py-3">Keep {symbol}</button></div></div>
      : <button onClick={() => saved ? setConfirm(true) : toggleWatch(symbol)} className="min-h-12 rounded-xl border border-border px-5 py-3 font-semibold hover:bg-hover">{saved ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}</button>}
    <span className="sr-only" role="status">{saved ? `${symbol} is in your watchlist` : `${symbol} is not in your watchlist`}</span>
  </div>
}

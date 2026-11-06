import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { usePractice } from './PracticeContext.js'
import { money } from './market.js'
import { validateTrade } from './practice.js'
import usePageHeading from './usePageHeading.js'

export default function TradeTicket({ stock, side }) {
  const { account, trade } = usePractice()
  const [quantity, setQuantity] = useState('')
  const [review, setReview] = useState(null)
  const [receipt, setReceipt] = useState(null)
  const [error, setError] = useState(null)
  const submitted = useRef(false)
  const label = side === 'buy' ? 'Buy' : 'Sell'
  const title = receipt ? 'Trade completed' : review ? `Review ${side}` : `${label} ${stock.symbol}`
  usePageHeading(title)
  const shares = account.holdings[stock.symbol] ?? 0
  const total = Math.round(stock.price * 100) * Number(quantity || 0) / 100
  function reviewTrade(event) {
    event.preventDefault()
    const message = validateTrade(account, stock, side, quantity)
    setError(message)
    if (!message) setReview({ ...stock, orderId: crypto.randomUUID() })
  }
  function confirmTrade() {
    if (submitted.current) return
    if (stock.price !== review.price) { setError('The quote changed. Edit quantity and review the updated estimate.'); return }
    submitted.current = true
    try { setReceipt(trade(review, side, quantity, review.orderId)); setError(null) }
    catch (cause) { setError(cause.message); submitted.current = false }
  }
  return <section className="max-w-xl">
    <h1 tabIndex={-1} className="text-3xl font-semibold tracking-tight">{title}</h1>
    <p className="mt-3 mb-6 text-sm text-muted">Practice trade · Virtual money only · No fees</p>
    <dl className="space-y-3 rounded-2xl bg-hover p-5 text-sm"><div className="flex justify-between gap-4"><dt>Investment</dt><dd>{stock.name} ({stock.symbol})</dd></div><div className="flex justify-between"><dt>Simulated price</dt><dd>{money(stock.price)}</dd></div><div className="flex justify-between"><dt>Available cash</dt><dd>{money(account.cashCents / 100)}</dd></div><div className="flex justify-between"><dt>Shares owned</dt><dd>{shares}</dd></div></dl>
    {error && <p role="alert" className="mt-5 rounded-xl border border-red-300 p-4 text-red-800">{error}</p>}
    {receipt ? <div role="status" className="mt-6 rounded-2xl border border-border p-5"><h2 className="text-xl font-semibold">{receipt.side === 'buy' ? 'Bought' : 'Sold'} {receipt.shares} {stock.symbol} shares</h2><p className="mt-3">Total: {money(receipt.totalCents / 100)}</p><p className="mt-2 break-all text-xs text-muted">Order {receipt.id}</p><p className="mt-3 text-sm text-muted">Your virtual balance and holdings have been updated.</p><div className="mt-5 flex flex-wrap gap-5"><Link to="/portfolio" className="font-semibold">View portfolio →</Link><Link to={`/portfolio/transactions/${receipt.id}`} className="font-semibold">View transaction →</Link><Link to={`/market/${stock.symbol}`} className="font-semibold">Back to stock details →</Link></div></div>
      : review ? <div className="mt-6 space-y-4"><p>{label} <strong>{quantity} shares</strong> at {money(review.price)} each.</p><p className="text-xl font-semibold">{side === 'buy' ? 'Estimated cost' : 'Estimated proceeds'}: {money(total)}</p><p className="text-sm text-muted">Cash after trade: {money(account.cashCents / 100 + (side === 'buy' ? -total : total))}</p><button onClick={confirmTrade} className="w-full rounded-xl bg-accent px-5 py-4 font-semibold">Confirm {side}</button><button onClick={() => { setReview(null); setError(null) }} className="w-full rounded-xl border border-border px-5 py-3">Edit quantity</button></div>
        : <form onSubmit={reviewTrade} noValidate className="mt-6 space-y-4"><label htmlFor="shares" className="block font-semibold">Number of shares</label><input id="shares" type="number" inputMode="numeric" min="1" step="1" value={quantity} onChange={(event) => { setQuantity(event.target.value); setError(null) }} aria-describedby="shares-help" className="w-full rounded-xl border border-border px-4 py-3" /><p id="shares-help" className="text-sm text-muted">Enter a positive whole number. {side === 'sell' && shares === 0 ? 'Buy shares before selling this investment.' : `You can ${side} up to ${side === 'buy' ? Math.floor(account.cashCents / Math.round(stock.price * 100)) : shares} shares.`}</p><p>Estimated {side === 'buy' ? 'cost' : 'proceeds'}: {Number.isFinite(total) && total >= 0 ? money(total) : '—'}</p><button className="w-full rounded-xl bg-accent px-5 py-4 font-semibold">Review {side}</button></form>}
  </section>
}

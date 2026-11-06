import { useParams } from 'react-router'
import BackLink from '../../components/ui/BackLink.jsx'
import { formatMoney } from '../../components/ui/format.js'
import usePortfolio from '../../features/market/usePortfolio.js'
import MarketState from '../../features/market/MarketState.jsx'
import usePageHeading from '../../features/market/usePageHeading.js'

function TransactionDetailPage() {
  const { transactionId } = useParams()
  const state = usePortfolio()
  const transaction = state.transactions.find((t) => t.id === transactionId)
  usePageHeading(state.loading ? null : transaction ? 'Transaction details' : 'Transaction not found')

  if (state.loading || state.error) return <><BackLink /><MarketState {...state} /></>

  if (!transaction) {
    return (
      <>
        <BackLink />
        <h1 tabIndex={-1} className="text-3xl font-semibold tracking-[-0.04em]">Transaction not found</h1>
      </>
    )
  }

  const rows = [
    ['Stock', transaction.symbol],
    ['Executed quantity', `${transaction.shares} shares`],
    ['Execution price', formatMoney(transaction.price)],
    ['Total value', formatMoney(transaction.totalCents / 100)],
    ['Executed at', transaction.executedAt],
    ['Transaction ID', transaction.id],
  ]

  return (
    <>
      <BackLink />
      <h1 tabIndex={-1} className="text-4xl font-semibold tracking-[-0.04em]">Transaction details</h1>

      <section aria-label="Transaction" className="mt-6 rounded-2xl border border-border p-6">
        <p className="font-[650]">{transaction.type === 'buy' ? 'Buy completed' : 'Sale completed'}</p>
        <p className="mt-1 text-muted">Virtual shares were {transaction.type === 'buy' ? 'added to' : 'removed from'} your portfolio.</p>
        <dl className="mt-5 flex flex-col gap-3">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0">
              <dt className="text-muted">{label}</dt>
              <dd className="text-right font-[650]">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  )
}

export default TransactionDetailPage

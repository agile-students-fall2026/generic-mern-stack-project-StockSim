export default function MarketState({ loading, error, retry }) {
  if (loading) return <p role="status" className="rounded-2xl bg-hover p-6">Loading practice market…</p>
  if (error) return <div role="alert" className="rounded-2xl border border-border p-6"><p>{error}</p><button className="mt-4 rounded-xl bg-accent px-5 py-3 font-semibold" onClick={retry}>Try again</button></div>
  return null
}

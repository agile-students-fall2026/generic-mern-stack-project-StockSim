import { useState } from 'react'
import { watchlistRequest } from './accountWatchlist.js'

export default function SaveCompanyButton({ symbol }) {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  async function save() {
    setStatus('saving')
    setError('')
    try {
      await watchlistRequest('', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      })
      setStatus('saved')
    } catch (failure) {
      setError(failure.message)
      setStatus('idle')
    }
  }

  return <div className="mb-6">
    <button type="button" disabled={status !== 'idle'} onClick={save} className="rounded-xl border border-border px-4 py-3">
      {status === 'saved' ? 'Saved to watchlist' : status === 'saving' ? 'Saving…' : `Save ${symbol} to watchlist`}
    </button>
    {error && <p className="mt-2" role="alert">{error}</p>}
  </div>
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router'

function GlossaryPage() {
  const [terms, setTerms] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    fetch('/api/glossary?q=' + query)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Could not load the glossary.')
        }
        return response.json()
      })
      .then((data) => {
        if (cancelled) {
          return
        }
        setTerms(data)
        setError('')
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) {
          return
        }
        setError('Could not load the glossary.')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [query])

  return (
    <>
      <Link
        to="/learn"
        className="mb-6 inline-flex min-h-11 items-center font-[650] text-ink underline underline-offset-[0.3em]"
      >
        Back
      </Link>

      <h1 tabIndex={-1} className="text-4xl font-semibold tracking-[-0.04em]">
        Glossary
      </h1>
      <p className="mt-3 text-muted">Simple definitions of common investing words.</p>

      <label className="mt-6 block">
        <span className="text-sm font-[650]">Search</span>
        <input
          className="mt-2 w-full rounded-2xl border border-border px-4 py-3"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      {loading && <p className="mt-6 rounded-2xl bg-hover p-6">Loading glossary...</p>}
      {error && <p className="mt-6 rounded-2xl border border-border p-6">{error}</p>}

      {!loading && !error && terms.length === 0 && (
        <p className="mt-6 text-muted">No matching terms.</p>
      )}

      {!loading && !error && terms.length > 0 && (
        <ul className="mt-6 flex flex-col gap-3">
          {terms.map((item) => (
            <li key={item.id} className="rounded-2xl border border-border p-5">
              <p className="font-[650]">{item.term}</p>
              <p className="mt-1 text-sm text-muted">{item.definition}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export default GlossaryPage

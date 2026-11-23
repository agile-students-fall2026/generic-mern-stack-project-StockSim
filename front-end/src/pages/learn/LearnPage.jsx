import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router'
import PageIntro from '../../components/layout/PageIntro.jsx'

function LearnPage() {
  const { completedLessons } = useOutletContext()
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const completedCount = completedLessons.length

  useEffect(() => {
    let cancelled = false

    fetch('/api/lessons')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Could not load lessons.')
        }
        return response.json()
      })
      .then((data) => {
        if (cancelled) {
          return
        }
        setLessons(data)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) {
          return
        }
        setError('Could not load lessons.')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <PageIntro
        eyebrow="Practice account"
        title="Learn"
        description="Learn about investing with short lessons."
      />

      {loading && <p className="rounded-2xl bg-hover p-6">Loading lessons...</p>}
      {error && <p className="rounded-2xl border border-border p-6">{error}</p>}

      {!loading && !error && (
        <>
          <section aria-label="Learning progress" className="rounded-2xl border border-border p-6">
            <p className="text-sm font-[650] tracking-[0.08em] text-muted uppercase">Lessons completed</p>
            <p className="mt-2 text-4xl font-semibold tracking-[-0.04em]">
              {completedCount} of {lessons.length}
            </p>
          </section>

          <section aria-label="Lessons" className="mt-8">
            <h2 className="text-xl font-semibold tracking-[-0.03em]">Lessons</h2>

            <ul className="mt-4 flex flex-col gap-3">
              {lessons.map((lesson) => {
                const isComplete = completedLessons.includes(lesson.id)

                return (
                  <li key={lesson.id}>
                    <Link
                      to={`/learn/${lesson.id}`}
                      className="block rounded-2xl border border-border p-5 text-ink no-underline hover:bg-hover"
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <p className="font-[650]">{lesson.title}</p>
                        <p className="text-sm font-[650] text-muted">
                          {isComplete ? 'Completed' : 'Not started'}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-muted">{lesson.description}</p>
                      <p className="mt-2 text-sm text-muted">{lesson.duration}</p>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        </>
      )}

      <Link
        to="/learn/glossary"
        className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-[2rem] border border-border px-6 py-3.5 font-[650] text-ink no-underline hover:bg-hover"
      >
        Glossary
      </Link>
    </>
  )
}

export default LearnPage

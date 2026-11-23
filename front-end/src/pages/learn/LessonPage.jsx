import { useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router'

function LessonPage() {
  const { lessonId } = useParams()
  const { completedLessons, setCompletedLessons } = useOutletContext()
  const [lesson, setLesson] = useState(null)
  const [loadedId, setLoadedId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    fetch(`/api/lessons/${lessonId}`)
      .then((response) => {
        if (response.status === 404) {
          return null
        }
        if (!response.ok) {
          throw new Error('Could not load this lesson.')
        }
        return response.json()
      })
      .then((data) => {
        if (cancelled) {
          return
        }
        setLesson(data)
        setError('')
        setLoadedId(lessonId)
      })
      .catch(() => {
        if (cancelled) {
          return
        }
        setLesson(null)
        setError('Could not load this lesson.')
        setLoadedId(lessonId)
      })

    return () => {
      cancelled = true
    }
  }, [lessonId])

  if (loadedId !== lessonId) {
    return <p className="rounded-2xl bg-hover p-6">Loading lesson...</p>
  }

  if (error) {
    return <p className="rounded-2xl border border-border p-6">{error}</p>
  }

  if (!lesson) {
    return (
      <>
        <Link
          to="/learn"
          className="mb-6 inline-flex min-h-11 items-center font-[650] text-ink underline underline-offset-[0.3em]"
        >
          Back
        </Link>
        <h1 tabIndex={-1} className="text-3xl font-semibold tracking-[-0.04em]">
          Lesson not found
        </h1>
      </>
    )
  }

  const isComplete = completedLessons.includes(lesson.id)

  function markAsComplete() {
    if (!isComplete) {
      setCompletedLessons([...completedLessons, lesson.id])
    }
  }

  return (
    <>
      <Link
        to="/learn"
        className="mb-6 inline-flex min-h-11 items-center font-[650] text-ink underline underline-offset-[0.3em]"
      >
        Back
      </Link>
      <p className="text-sm font-[650] tracking-[0.08em] text-muted uppercase">
        Lesson {lesson.lessonNumber} of {lesson.lessonCount} | {lesson.duration}
      </p>
      <h1 tabIndex={-1} className="mt-2 text-4xl font-semibold tracking-[-0.04em]">
        {lesson.title}
      </h1>

      <img
        src={lesson.imageUrl}
        alt={lesson.title}
        className="mt-6 w-full rounded-2xl border border-border object-cover"
      />

      <p className="mt-6 text-lg leading-[1.7] text-muted">{lesson.content}</p>

      {isComplete ? (
        <p className="mt-8 font-[650]">Completed</p>
      ) : (
        <button
          type="button"
          onClick={markAsComplete}
          className="mt-8 min-h-12 w-full cursor-pointer rounded-[2rem] bg-accent px-6 py-3.5 font-[650] text-ink hover:bg-accent-hover"
        >
          Mark as Complete
        </button>
      )}

      <div className="mt-8 flex flex-col gap-3">
        {lesson.previousLessonId && (
          <Link
            to={`/learn/${lesson.previousLessonId}`}
            className="inline-flex min-h-12 items-center justify-center rounded-[2rem] border border-border px-6 py-3.5 font-[650] text-ink no-underline hover:bg-hover"
          >
            Previous lesson
          </Link>
        )}
        {lesson.nextLessonId && (
          <Link
            to={`/learn/${lesson.nextLessonId}`}
            className="inline-flex min-h-12 items-center justify-center rounded-[2rem] border border-border px-6 py-3.5 font-[650] text-ink no-underline hover:bg-hover"
          >
            Next lesson
          </Link>
        )}
      </div>
    </>
  )
}

export default LessonPage

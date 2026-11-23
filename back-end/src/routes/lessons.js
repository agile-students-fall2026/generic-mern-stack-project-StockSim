import { Router } from 'express'
import { getLessonById, getLessonSummaries } from '../models/lesson.js'

export function createLessonsRouter() {
  const router = Router()

  router.get('/', (_req, res) => {
    res.json(getLessonSummaries())
  })

  router.get('/:id', (req, res) => {
    const lesson = getLessonById(req.params.id)

    if (!lesson) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Lesson not found.' } })
    }

    res.json(lesson)
  })

  return router
}

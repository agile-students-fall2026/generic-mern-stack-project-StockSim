import { Router } from 'express'
import { getGlossaryTerms } from '../models/glossary.js'

export function createGlossaryRouter() {
  const router = Router()

  router.get('/', (req, res) => {
    const search = req.query.q || ''
    res.json(getGlossaryTerms(search))
  })

  return router
}

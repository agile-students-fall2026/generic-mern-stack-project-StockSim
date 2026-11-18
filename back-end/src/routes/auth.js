import { Router } from 'express'
import { matchedData } from 'express-validator'
import { hashPassword } from '../services/passwords.js'
import { DuplicateEmailError } from '../stores/memoryUserStore.js'
import { validateRegistration } from '../validation/registration.js'

function notImplemented(feature) {
  return (_req, res) => {
    res.status(501).json({
      error: { code: 'NOT_IMPLEMENTED', message: `${feature} is not implemented yet.` },
    })
  }
}

export default function createAuthRouter(userStore) {
  const router = Router()

  router.post('/register', validateRegistration, async (req, res) => {
    const { name, email, password } = matchedData(req, { locations: ['body'] })

    try {
      if (await userStore.findByEmail(email)) throw new DuplicateEmailError()
      const passwordHash = await hashPassword(password)
      const user = await userStore.create({ name, email, passwordHash })
      res.status(201).json({
        user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
      })
    } catch (error) {
      if (!(error instanceof DuplicateEmailError)) throw error
      res.status(409).json({
        error: { code: 'EMAIL_IN_USE', message: error.message, fields: { email: error.message } },
      })
    }
  })

  router.post('/login', notImplemented('Login'))
  router.post('/logout', notImplemented('Logout'))
  router.post('/forgot-password', notImplemented('Password recovery'))
  router.post('/reset-password', notImplemented('Password reset'))

  return router
}

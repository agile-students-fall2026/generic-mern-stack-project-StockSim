import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { matchedData } from 'express-validator'
import { hashPassword, verifyPassword } from '../services/passwords.js'
import { SESSION_COOKIE, SESSION_SECONDS } from '../services/sessions.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { trustedOrigin } from '../middleware/trustedOrigin.js'
import { validateLogin } from '../validation/login.js'
import { DuplicateEmailError } from '../stores/memoryUserStore.js'
import { validateRegistration } from '../validation/registration.js'

function notImplemented(feature) {
  return (_req, res) => {
    res.status(501).json({
      error: { code: 'NOT_IMPLEMENTED', message: `${feature} is not implemented yet.` },
    })
  }
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt }
}

// Do the same password-hashing work for unknown emails as for known users.
const dummyHash = `scrypt$32768$8$3$${'0'.repeat(32)}$${'0'.repeat(128)}`

export default function createAuthRouter(userStore, sessions) {
  const router = Router()
  const loginLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: { code: 'TOO_MANY_ATTEMPTS', message: 'Too many login attempts. Try again in 15 minutes.' } },
  })

  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })
  router.use(trustedOrigin)

  router.post('/register', validateRegistration, async (req, res) => {
    const { name, email, password } = matchedData(req, { locations: ['body'] })

    try {
      if (await userStore.findByEmail(email)) throw new DuplicateEmailError()
      const passwordHash = await hashPassword(password)
      const user = await userStore.create({ name, email, passwordHash })
      res.status(201).json({ user: publicUser(user) })
    } catch (error) {
      if (!(error instanceof DuplicateEmailError)) throw error
      res.status(409).json({
        error: { code: 'EMAIL_IN_USE', message: error.message, fields: { email: error.message } },
      })
    }
  })

  router.post('/login', loginLimit, validateLogin, async (req, res) => {
    const { email, password } = matchedData(req, { locations: ['body'] })
    const user = await userStore.findByEmail(email)
    const matches = await verifyPassword(password, user?.passwordHash ?? dummyHash)
    if (!user || !matches) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' },
      })
    }
    const token = sessions.issue(user.id)
    sessions.revoke(req.cookies[SESSION_COOKIE])
    res.cookie(SESSION_COOKIE, token, { ...sessions.cookieOptions, maxAge: SESSION_SECONDS * 1000 })
    res.json({ user: publicUser(user) })
  })

  router.post('/logout', (req, res) => {
    sessions.revoke(req.cookies[SESSION_COOKIE])
    res.clearCookie(SESSION_COOKIE, sessions.cookieOptions)
    res.status(204).end()
  })

  router.get('/me', requireAuth(userStore, sessions), (req, res) => {
    res.json({ user: publicUser(req.user) })
  })
  router.post('/forgot-password', notImplemented('Password recovery'))
  router.post('/reset-password', notImplemented('Password reset'))

  return router
}

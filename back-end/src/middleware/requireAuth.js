import { SESSION_COOKIE } from '../services/sessions.js'

export function requireAuth(userStore, sessions) {
  return async (req, res, next) => {
    const auth = sessions.read(req.cookies[SESSION_COOKIE])
    const user = auth ? await userStore.findById(auth.userId) : null
    if (!user || user.authVersion !== auth.authVersion) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Please log in to continue.' },
      })
    }
    req.auth = auth
    req.user = user
    next()
  }
}

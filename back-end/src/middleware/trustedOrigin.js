// Browser cookie requests must come from this API or the configured frontend.
// Requests without browser headers (curl, tests, API clients) are also supported.
export function trustedOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  const origin = req.get('origin')
  const allowed = [
    `${req.protocol}://${req.get('host')}`,
    process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]
  if (req.get('sec-fetch-site') === 'cross-site' || (origin && !allowed.includes(origin))) {
    return res.status(403).json({
      error: { code: 'UNTRUSTED_ORIGIN', message: 'This origin is not allowed to submit authentication requests.' },
    })
  }
  next()
}

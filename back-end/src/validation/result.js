import { validationResult } from 'express-validator'

export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req)
  if (errors.isEmpty()) return next()

  // Never return submitted passwords or other field values.
  const fields = Object.fromEntries(errors.array({ onlyFirstError: true }).map(({ path, msg }) => [path, msg]))
  res.status(400).json({
    error: { code: 'VALIDATION_ERROR', message: 'Check the highlighted fields.', fields },
  })
}

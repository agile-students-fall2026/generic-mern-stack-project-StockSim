import { body } from 'express-validator'
import { handleValidationErrors } from './result.js'

export const validateLogin = [
  body('email')
    .isString().withMessage('Enter a valid email address.').bail()
    .trim()
    .isLength({ max: 254 }).withMessage('Email must not exceed 254 characters.').bail()
    .isEmail().withMessage('Enter a valid email address.').bail()
    .toLowerCase(),
  body('password')
    .isString().withMessage('Password must be text.').bail()
    .isLength({ min: 1, max: 128 }).withMessage('Enter your password (up to 128 characters).'),
  handleValidationErrors,
]

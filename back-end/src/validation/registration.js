import { body } from 'express-validator'
import { handleValidationErrors } from './result.js'

export const validateRegistration = [
  body('name')
    .isString().withMessage('Name must be text.').bail()
    .trim()
    .isLength({ min: 1, max: 80 }).withMessage('Name must contain 1 to 80 characters.'),
  body('email')
    .isString().withMessage('Enter a valid email address.').bail()
    .trim()
    .isLength({ max: 254 }).withMessage('Email must not exceed 254 characters.').bail()
    .isEmail().withMessage('Enter a valid email address.').bail()
    .toLowerCase(),
  body('password')
    .isString().withMessage('Password must be text.').bail()
    .isLength({ min: 8, max: 128 }).withMessage('Password must contain 8 to 128 characters.').bail()
    .custom((value) => value.trim().length > 0).withMessage('Password cannot contain only spaces.'),
  handleValidationErrors,
]

import { body } from 'express-validator'
import { handleValidationErrors } from './result.js'

export const validateForgotPassword = [
  body('email')
    .isString().withMessage('Enter a valid email address.').bail()
    .trim()
    .isLength({ max: 254 }).withMessage('Email must not exceed 254 characters.').bail()
    .isEmail().withMessage('Enter a valid email address.').bail()
    .toLowerCase(),
  handleValidationErrors,
]

export const validateResetPassword = [
  body('token')
    .isString().withMessage('A reset token is required.').bail()
    .matches(/^[0-9a-f]{64}$/).withMessage('Use the reset token from your email link.'),
  body('password')
    .isString().withMessage('Password must be text.').bail()
    .isLength({ min: 8, max: 128 }).withMessage('Password must contain 8 to 128 characters.').bail()
    .custom(value => value.trim().length > 0).withMessage('Password cannot contain only spaces.'),
  body('confirmPassword')
    .isString().withMessage('Confirm your new password.').bail()
    .custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match.'),
  handleValidationErrors,
]

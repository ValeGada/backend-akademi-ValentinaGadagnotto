const { body } = require('express-validator');

const userCreateValidator = [
  body('name')
    .notEmpty().withMessage('Name is a required field'),
  body('email')
    .normalizeEmail().isEmail().withMessage('Must be a valid email address'),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must contain at least 6 characters'),
  body('role')
    .isIn(['admin', 'reception']).withMessage('Role must be admin or reception')
];

const userEditValidator = [
  body('name')
    .optional(),
  body('email')
    .optional().normalizeEmail().isEmail().withMessage('Must be a valid email address'),
  body('password')
    .optional().isLength({ min: 6 }).withMessage('Password must contain at least 6 characters'),
  body('role')
    .optional().isIn(['admin', 'reception']).withMessage('Role must be admin or reception')
];

const newPasswordValidator = [
  body('newPassword')
    .notEmpty().withMessage('New password is required.')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long.')
];

exports.userCreateValidator = userCreateValidator;
exports.userEditValidator = userEditValidator;
exports.newPasswordValidator = newPasswordValidator;
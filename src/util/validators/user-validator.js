const { body } = require('express-validator');

const createUserValidator = [
  body('name')
    .notEmpty().withMessage('Name is a required field'),
  body('email')
    .normalizeEmail().isEmail().withMessage('Must be a valid email'),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must contain at least 6 characters'),
  body('role')
    .isIn(['admin', 'reception']).withMessage('Role must be admin or reception')
];

const newPasswordValidator = [
  body('newPassword')
    .notEmpty().withMessage("New password is required.")
    .isLength({ min: 6 }).withMessage("New password must be at least 6 characters long.")
]

exports.createUserValidator = createUserValidator;
exports.newPasswordValidator = newPasswordValidator;
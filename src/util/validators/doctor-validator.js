const { body } = require('express-validator');

const doctorCreateValidator = [
    body('name')
        .notEmpty().withMessage('Name is a required field.'),
    body('DNI')
        .notEmpty().withMessage('DNI is required.')
        .isLength({ min: 7 }).withMessage('DNI must be at least 7 digits.')
        .matches(/^\d+$/).withMessage('DNI must contain only digits.'),
    body('email')
        .normalizeEmail().isEmail().withMessage('Must be a valid email address.'),
    body('specialty')
        .notEmpty().withMessage('Specialty is a required field.'),
    body('active')
        .isIn(['active', 'inactive']).withMessage('Must be either "active" or "inactive".')
];

const doctorEditValidator = [
    body('name')
        .optional(),
    body('DNI')
        .optional()
        .isLength({ min: 7 }).withMessage('DNI must be at least 7 digits.')
        .matches(/^\d+$/).withMessage('DNI must contain only digits.'),
    body('email')
        .optional().normalizeEmail().isEmail().withMessage('Must be a valid email address.'),
    body('specialty')
        .optional(),
    body('active')
        .optional().isIn(['active', 'inactive']).withMessage('Must be either "active" or "inactive".')
];

exports.doctorCreateValidator = doctorCreateValidator;
exports.doctorEditValidator = doctorEditValidator;
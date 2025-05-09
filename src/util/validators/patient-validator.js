const { body } = require('express-validator');

const patientCreateValidator = [
    body('name')
        .notEmpty().withMessage('Name is a required field.'),
    body('DNI')
        .notEmpty().withMessage('DNI is required.')
        .isLength({ min: 7 }).withMessage('DNI must be at least 7 digits.')
        .matches(/^\d+$/).withMessage('DNI must contain only digits.'),
    body('email')
        .normalizeEmail().isEmail().withMessage('Must be a valid email address.'),
    body('health_insurance')
        .optional()
];

const patientEditValidator = [
    body('name')
        .optional(),
    body('DNI')
        .optional()
        .isLength({ min: 7 }).withMessage('DNI must be at least 7 digits.')
        .matches(/^\d+$/).withMessage('DNI must contain only digits.'),
    body('email')
        .optional().normalizeEmail().isEmail().withMessage('Must be a valid email address.'),
    body('health_insurance')
        .optional()
];

exports.patientCreateValidator = patientCreateValidator;
exports.patientEditValidator = patientEditValidator;
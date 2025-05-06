const { body } = require('express-validator');

const patientValidator = [
    body('name')
        .notEmpty().withMessage('Name is a required field.'),
    body('DNI')
        .notEmpty().isInt().isLength({ min: 7 }).withMessage('DNI is a required field.'),
    body('email')
        .normalizeEmail().isEmail().withMessage('Must be a valid email address.'),
];

module.exports = patientValidator;
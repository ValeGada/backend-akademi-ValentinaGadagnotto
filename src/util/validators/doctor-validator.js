const { body } = require('express-validator');

const doctorValidator = [
    body('name')
        .notEmpty().withMessage('Name is a required field.'),
    body('DNI')
        .notEmpty().isInt().isLength({ min: 7 }).withMessage('DNI is a required field.'),
    body('email')
        .normalizeEmail().isEmail().withMessage('Must be a valid email address.'),
    body('specialty')
        .notEmpty().withMessage('Specialty is a required field.'),
    body('active')
        .notEmpty().isBoolean().withMessage('Must be a true or false input.')
];

module.exports = doctorValidator;
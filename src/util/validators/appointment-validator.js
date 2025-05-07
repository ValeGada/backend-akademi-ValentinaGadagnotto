const { body } = require('express-validator');

const appointmentValidator = [
    body('date')
        .notEmpty().withMessage('Date is required.')
        .custom(async (value, { req }) =>{ 
            const inputDate = new Date(`${value}T${req.body.hour}`);
            const now = new Date();

            if (isNaN(inputDate.getTime())) {
                throw new Error('Date and time must form a valid datetime.');
            }
            
            if (inputDate <= now) {
                throw new Error('Appointment must be scheduled in the future.');
            }
        }),
    body('state')
        .optional()
        .isIn(['confirmado', 'cancelado'])
        .withMessage('State must be either "confirmed" or "canceled".')
];

module.exports = appointmentValidator;
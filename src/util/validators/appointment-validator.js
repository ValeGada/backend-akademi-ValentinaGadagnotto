const { body } = require('express-validator');
const Patient = require('../../models/patient');
const Doctor = require('../../models/doctor');

const appointmentCreateValidator = [
    body('patient')
        .notEmpty().withMessage('Patient id is required.')
        .custom( async (value) =>{
            const validPatient = await Patient.findById(value);

            if (!validPatient) {
                throw new Error('Invalid patient id.');
            }
        }),
    body('doctor')
        .notEmpty().withMessage('Doctor id is required.')
        .custom( async (value) =>{
            const validDoctor = await Doctor.findById(value);

            if (!validDoctor) {
                throw new Error('Invalid doctor id.');
            }
        }),
    body('date')
        .notEmpty().withMessage('Date is required.')
        .custom(async (value, { req }) =>{ 
            if (!req.body.hour) throw new Error('Hour is required to validate date.');
            const inputDate = new Date(`${value}T${req.body.hour}`);
            const now = new Date();

            if (isNaN(inputDate.getTime())) {
                throw new Error('Invalid date or hour format.');
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

const appointmentEditValidator = [
    body('patient')
        .optional()
        .custom( async (value) =>{
            const validPatient = await Patient.findById(value);

            if (!validPatient) {
                throw new Error('Invalid patient id.');
            }
        }),
    body('doctor')
        .optional()
        .custom( async (value) =>{
            const validDoctor = await Doctor.findById(value);

            if (!validDoctor) {
                throw new Error('Invalid doctor id.');
            }
        }),
    body('date')
        .optional()
        .custom(async (value, { req }) =>{ 
            const inputDate = new Date(`${value}T${req.body.hour}`);
            const now = new Date();

            if (isNaN(inputDate.getTime())) {
                throw new Error('Invalid date or hour format.');
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

exports.appointmentCreateValidator = appointmentCreateValidator;
exports.appointmentEditValidator = appointmentEditValidator;
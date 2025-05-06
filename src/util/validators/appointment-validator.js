const Appointment = require('../../models/appointment');
const { body } = require('express-validator');

const appointmentValidator = [
    body('specialty')
        .notEmpty().withMessage('Specialty is a required field.'),
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

            const doctorId = req.body.doctor;

            // Verificar si ya existe un turno con el mismo doctor, día y hora exacta
            const existingAppointment = await Appointment.findOne({ doctor: doctorId, date: inputDate });
        
            if (existingAppointment) {
                throw new Error('This doctor already has an appointment at that time.');
            }
        
            // Verificar si el doctor ya tiene 5 turnos en ese día
            const startOfDay = new Date(inputDate);
            startOfDay.setHours(0, 0, 0, 0);
        
            const endOfDay = new Date(inputDate);
            endOfDay.setHours(23, 59, 59, 999);
        
            const dailyCount = await Appointment.countDocuments({
                doctor: doctorId,
                date: { $gte: startOfDay, $lte: endOfDay }
            });
        
            if (dailyCount >= 5) {
                throw new Error('This doctor already has 5 appointments on this day.');
            }

            return true;
        }),
    body('state')
        .notEmpty().withMessage('State is required.')
        .isIn(['confirmado', 'cancelado'])
        .withMessage('State must be either "confirmado" or "cancelado".')
];

module.exports = appointmentValidator;
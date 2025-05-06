const express = require('express');

const appointmentsControllers = require('../controllers/appointments-controllers');

const appointmentValidator = require('../util/validators/appointment-validator');
const checkAuth = require('../middlewares/check-auth');

const router = express.Router();

router.use(checkAuth);

router.get('/', appointmentsControllers.getAppointments);

router.get('/:id', appointmentsControllers.getAppointmentById);

router.post('/', appointmentValidator, appointmentsControllers.createAppointment);

router.patch('/:id', appointmentValidator, appointmentsControllers.editAppointment);

router.delete('/:id', appointmentsControllers.deleteAppointment);

module.exports = router;
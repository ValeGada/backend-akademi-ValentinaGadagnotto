const express = require('express');

const appointmentsControllers = require('../controllers/appointments-controllers');

const { appointmentCreateValidator, appointmentEditValidator } = require('../util/validators/appointment-validator');
const checkAuth = require('../middlewares/check-auth');

const router = express.Router();

router.use(checkAuth);

router.get('/', appointmentsControllers.getAppointments);

router.get('/:id', appointmentsControllers.getAppointmentById);

router.post('/', appointmentCreateValidator, appointmentsControllers.createAppointment);

router.patch('/:id', appointmentEditValidator, appointmentsControllers.editAppointment);

module.exports = router;
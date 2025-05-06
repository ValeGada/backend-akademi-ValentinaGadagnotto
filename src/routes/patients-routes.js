const express = require('express');

const patientsControllers = require('../controllers/patients-controllers');

const patientValidator = require('../util/validators/patient-validator');
const checkAuth = require('../middlewares/check-auth');

const router = express.Router();

router.use(checkAuth);

router.get('/', patientsControllers.getPatients);

router.get('/:id', patientsControllers.getPatientById);

router.post('/', patientValidator, patientsControllers.createPatient);

router.patch('/:id', patientValidator, patientsControllers.editPatient);

router.delete('/:id', patientsControllers.deletePatient);

module.exports = router;
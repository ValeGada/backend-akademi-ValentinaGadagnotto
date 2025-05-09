const express = require('express');

const patientsControllers = require('../controllers/patients-controllers');

const { patientCreateValidator, patientEditValidator } = require('../util/validators/patient-validator');
const checkAuth = require('../middlewares/check-auth');

const router = express.Router();

router.use(checkAuth);

router.get('/', patientsControllers.getPatients);

router.get('/:id', patientsControllers.getPatientById);

router.post('/', patientCreateValidator, patientsControllers.createPatient);

router.patch('/:id', patientEditValidator, patientsControllers.editPatient);

router.delete('/:id', patientsControllers.deletePatient);

module.exports = router;
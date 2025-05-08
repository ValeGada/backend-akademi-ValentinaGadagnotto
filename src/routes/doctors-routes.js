const express = require('express');

const doctorsControllers = require('../controllers/doctors-controllers');

const doctorValidator = require('../util/validators/doctor-validator');
const checkAuth = require('../middlewares/check-auth');
const checkAdmin = require('../middlewares/check-admin');

const router = express.Router();

router.use(checkAuth);

router.get('/', doctorsControllers.getDoctors);

router.get('/:id', doctorsControllers.getDoctorById);

router.get('/reports/top-doctors', checkAdmin, doctorsControllers.getTopDoctorsReport);

router.post('/', doctorValidator, doctorsControllers.createDoctor);

router.patch('/:id', doctorValidator, doctorsControllers.editDoctor);

module.exports = router;
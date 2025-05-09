const express = require('express');

const doctorsControllers = require('../controllers/doctors-controllers');

const { doctorCreateValidator, doctorEditValidator } = require('../util/validators/doctor-validator');
const checkAuth = require('../middlewares/check-auth');
const checkAdmin = require('../middlewares/check-admin');

const router = express.Router();

router.use(checkAuth);

router.get('/', doctorsControllers.getDoctors);

router.get('/:id', doctorsControllers.getDoctorById);

router.get('/reports/top-doctors', checkAdmin, doctorsControllers.getTopDoctorsReport);

router.post('/', doctorCreateValidator, doctorsControllers.createDoctor);

router.patch('/:id', doctorEditValidator, doctorsControllers.editDoctor);

module.exports = router;
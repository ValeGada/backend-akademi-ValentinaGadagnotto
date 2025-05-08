const { validationResult } = require('express-validator');

const HttpError = require('../util/errors/http-error');
const Doctor = require('../models/doctor');

// Normaliza strings para el filtrado
const normalizeString = (str) =>
    str
      .normalize("NFD") // Descompone letras con tilde (á --> a/´)
      .replace(/[\u0300-\u036f]/g, "") // Elimina tildes, diéresis y otros diacríticos
      .toLowerCase()
      .trim();

const getDoctors = async (req, res, next) => {
    const { specialty, page=1, limit=10 } = req.query;
    
    let doctors;
    let totalDoctors;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (isNaN(pageNumber) || pageNumber <= 0) {
        return next(new HttpError('Invalid page number', 400));
    }
    if (isNaN(limitNumber) || limitNumber <= 0) {
        return next(new HttpError('Invalid limit number', 400));
    }

    let filter = {};
    try {
        // if (specialty) filter.specialty = specialty;
        if (specialty) {
            const normalizedSpe = specialty.trim();
            filter.specialty = new RegExp(normalizedSpe, 'i'); // Coincidencia parcial, sin tildes ni mayúsculas
        }
    
        totalDoctors = await Doctor.countDocuments(filter);
    
        doctors = await Doctor.find(filter)
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber)
        
        if (doctors.length === 0) {
            return next(new HttpError('No doctors found', 404));
        }
    } catch (err) {
        return next(new HttpError('Fetching doctors failed.', 500));
    }
    res.json({
        doctors: doctors.map((user) => user.toObject({ getters: true })),
        totalDoctors,
        totalPages: Math.ceil(totalDoctors / limitNumber),
        currentPage: pageNumber,
    });
};

const getDoctorById = async (req, res, next) => {
    const doctorId = req.params.id;

    let doctor;
        try {
            doctor = await Doctor.findById(doctorId);
        } catch (err) {
            return next(new HttpError('Fetching doctor failed.', 500));
        }
        
        if (!doctor) {
            return next(new HttpError('Doctor not found.', 404));
        }
        
        res.json({ doctor: doctor.toObject({ getters: true }) });
};

const createDoctor = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid inputs, please check your data.', 422));
    }

    const { name, DNI, email, specialty, active } = req.body;
    
    let existingDoctor;
    try {
        existingDoctor = await Doctor.findOne({ DNI });
    } catch (err) {
        return next(new HttpError('Could not create doctor, please try again later.', 500));
    }

    if (existingDoctor) {
        return next(new HttpError('It already exists a doctor with this DNI.', 422));
    }

    const createdDoctor = new Doctor({
        name,
        DNI,
        email,
        specialty, 
        active
    });

    try {
        await createdDoctor.save();
    } catch (err) {
        return next(new HttpError('Could not save new doctor, please try again later.', 500));
    }

    res.status(201).json({ 
        doctorId: createdDoctor.id,
        doctorDNI: createdDoctor.DNI,
        email: createdDoctor.email
    });
};

const editDoctor = async (req, res, next) => {
    const { id } = req.params; 
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'DNI', 'email', 'specialty', 'active'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return next(new HttpError('Invalid updates.', 400));
    }

    try {
        const doctor = await Doctor.findById(id).populate('appointments');
        if (!doctor) {
            return next(new HttpError('Doctor not found.', 404));
        }

        // Si el doctor tiene turnos asignados, no se puede dar de baja
        if (
            req.body.active === 'inactive' &&
            updates.includes('active') && 
            doctor.appointments && 
            doctor.appointments.length > 0
        ) {
            return next(new HttpError('Cannot set doctor with assigned appointments as inactive.', 400));
        }
        
        updates.forEach(update => doctor[update] = req.body[update]);
        await doctor.save();

        res.status(200).json({ doctor });
    } catch (err) {
        return next(new HttpError('Could not save changes, please try again later.', 500));
    }
};

exports.getDoctors = getDoctors;
exports.getDoctorById = getDoctorById;
exports.createDoctor = createDoctor;
exports.editDoctor = editDoctor;
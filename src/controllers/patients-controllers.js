const { validationResult } = require('express-validator');

const HttpError = require('../util/errors/http-error');
const Patient = require('../models/patient');
const Appointment = require('../models/appointment');

// Normaliza strings para el filtrado
// const normalizeString = (str) =>
//     str
//       .normalize("NFD") // Descompone letras con tilde (á --> a/´)
//       .replace(/[\u0300-\u036f]/g, "") // Elimina tildes, diéresis y otros diacríticos
//       .toLowerCase()
//       .trim();

const getPatients = async (req, res, next) => {
    const { name, DNI, health_insurance, page=1, limit=10 } = req.query;
    
    let patients;
    let totalPatients;

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
        if (name) {
            // const normalized = normalizeString(name);
            const normalizedName = name.trim();
            filter.name = new RegExp(normalizedName, 'i');
        }
        
        if (DNI) {
            const normalizedDNI = DNI.trim();
            filter.DNI = new RegExp(normalizedDNI, 'i');
        }

        if (health_insurance) {
            const normalizedHi = health_insurance.trim();
            filter.health_insurance = new RegExp(normalizedHi, 'i');
        }
    
        totalPatients = await Patient.countDocuments(filter);
    
        patients = await Patient.find(filter)
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber)
        
        if (patients.length === 0) {
            return next(new HttpError('No patients found', 404));
        }
    } catch (err) {
        return next(new HttpError('Fetching patients failed.', 500));
    }

    res.json({
        patients: patients.map((user) => user.toObject({ getters: true })),
        totalPatients,
        totalPages: Math.ceil(totalPatients / limitNumber),
        currentPage: pageNumber,
    });
};

const getPatientById = async (req, res, next) => {
    const patientId = req.params.id;

    let patient;
    try {
        patient = await Patient.findById(patientId);
        } catch (err) {
            return next(new HttpError('Fetching patient failed.', 500));
        }
        
        if (!patient) {
            return next(new HttpError('Patient not found.', 404));
        }
        
        res.json({ patient: patient.toObject({ getters: true }) });
};

const createPatient = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid inputs, please check your data.', 422));
    }

    const { name, DNI, email, health_insurance } = req.body;
    
    let existingPatient;
    try {
        existingPatient = await Patient.findOne({ DNI });
    } catch (err) {
        return next(new HttpError('Could not create patient, please try again later.', 500));
    }

    if (existingPatient) {
        return next(new HttpError('It already exists a user with this DNI.', 422));
    }

    const createdPatient = new Patient({
        name,
        DNI,
        email,
        health_insurance
    });

    try {
        await createdPatient.save();
    } catch (err) {
        return next(new HttpError('Could not save new patient, please try again later.', 500));
    }

    res.status(201).json({ 
        patientId: createdPatient.id,
        patientDNI: createdPatient.DNI,
        email: createdPatient.email
    });
};

const editPatient = async (req, res, next) => {
    const { id } = req.params; 
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'DNI', 'email', 'health_insurance'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return next(new HttpError('Invalid updates.', 400));
    }

    try {
        const patient = await Patient.findById(id);
        if (!patient) {
            return next(new HttpError('Patient not found.', 404));
        }
        
        updates.forEach(update => patient[update] = req.body[update]);
        await patient.save();
        
        res.send(patient);
    } catch (err) {
        return next(new HttpError('Could not save changes, please try again later.', 500));
    }
};

const deletePatient = async (req, res, next) => {
    const { id } = req.params;

    try {
        const patient = await Patient.findById(id);
        if (!patient) {
            return next(new HttpError('Patient not found.', 404));
        }

        // Cancelar turnos del paciente antes de eliminarlo
        await Appointment.updateMany(
            { patient: id },
            { $set: { state: 'canceled' } }
        );

        await patient.deleteOne();
        res.send(patient);
    } catch (err) {
        return next(new HttpError('Could not delete patient, please try again later.', 500));
    }
};

exports.getPatients = getPatients;
exports.getPatientById = getPatientById;
exports.createPatient = createPatient;
exports.editPatient = editPatient;
exports.deletePatient = deletePatient;
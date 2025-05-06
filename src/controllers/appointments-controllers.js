const { validationResult } = require('express-validator');

const HttpError = require('../util/errors/http-error');
const Appointment = require('../models/appointment');
const Patient = require('../models/patient');
const Doctor = require('../models/doctor');

const getAppointments = async (req, res, next) => {
    const { patient, doctor, date, page=1, limit=10 } = req.query;
    
    let appointments;
    let totalAppointments;

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
        // Corregir
        if (patient) {
            filter.patient = patient;
            await Patient.findOne({ patient })
        }
            
        if (doctor) filter.doctor = doctor;
        if (date) filter.date = date;
    
        totalAppointments = await Appointment.countDocuments(filter);
    
        appointments = await Appointment.find(filter)
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber)
        
        if (appointments.length === 0) {
            return next(new HttpError('No appointments found', 404));
        }
    } catch (err) {
        return next(new HttpError('Fetching appointments failed.', 500));
    }
    res.json({
        appointments: appointments.map((user) => user.toObject({ getters: true })),
        totalAppointments,
        totalPages: Math.ceil(totalAppointments / limitNumber),
        currentPage: pageNumber,
    });
};

const getAppointmentById = async (req, res, next) => {
    const appointmentId = req.params.id;

    let appointment;
        try {
            appointment = await Appointment.findById(appointmentId);
        } catch (err) {
            return next(new HttpError('Fetching appointment failed.', 500));
        }
        
        if (!appointment) {
            return next(new HttpError('Appointment not found.', 404));
        }
        
        res.json({ appointment: appointment.toObject({ getters: true }) });
};

const createAppointment = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid inputs, please check your data.', 422));
    }

    const { patient, doctor, specialty, date, state } = req.body;
    
    let existingAppointment;
    try {
        existingAppointment = await Appointment.findOne({ date });
    } catch (err) {
        return next(new HttpError('Could not create appointment, please try again later.', 500));
    }

    if (existingAppointment) {
        return next(new HttpError('It already exists an appointment at this DNI.', 422));
    }

    const createdAppointment = new Appointment({
        patient: patientObj._id,
        doctor: doctorObj._id,
        specialty,
        date,
        state
    });

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
    
        await createdAppointment.save({ session: sess });
        patientObj.appointments.push(createdAppointment);
        doctorObj.appointments.push(createdAppointment);
        await patientObj.save({ session: sess });
        await doctorObj.save({ session: sess });
    
        await createdAppointment.populate({ path: 'patient', select: 'appointment' });
        await createdAppointment.populate({ path: 'doctor', select: 'appointment' });
    
        await sess.commitTransaction();
        
    } catch (err) {
        console.log(err);
    
        return next(
            new HttpError('Creating appointment failed, please try again.', 500)
        );
    }

    res.status(201).json({ appointment: newAppointment.toObject({ getters: true }) });
};

const editAppointment = async (req, res, next) => {
    const { id } = req.params; 
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'DNI', 'email', 'phone_number', 'health_insurance'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return next(new HttpError('Invalid updates.', 400));
    }

    try {
        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return next(new HttpError('Appointment not found.', 404));
        }

        updates.forEach(update => appointment[update] = req.body[update]);
        await appointment.save();

        res.send(appointment);
    } catch (err) {
        return next(new HttpError('Could not save changes, please try again later.', 500));
    }
};

const deleteAppointment = async (req, res, next) => {
    const { id } = req.params;

    try {
        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return next(new HttpError('Appointment not found.', 404));
        }

        await appointment.deleteOne();
        res.send(appointment);
    } catch (err) {
        return next(new HttpError('Could not delete appointment, please try again later.', 500));
    }
};

exports.createAppointment = createAppointment;
exports.getAppointments = getAppointments;
exports.getAppointmentById = getAppointmentById;
exports.editAppointment = editAppointment;
exports.deleteAppointment = deleteAppointment;
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

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
        // Validación de paciente
        if (patient) {
            const existingPatient = await Patient.findById(patient);
            
            if (!existingPatient) {
                return next(new HttpError('Patient not found.', 404));
            }

            filter.patient = patient;
        }

        // Validación de doctor
        if (doctor) {
            const existingDoctor = await Doctor.findById(doctor);
            
            if (!existingDoctor) {
                return next(new HttpError('Doctor not found.', 404));
            }

            filter.doctor = doctor;
        }

        // Validación de fecha (en el validator también está, pero para cuando se provee una fecha, en POST y PATCH)
        if (date) {
            const inputDate = new Date(date);
            if (isNaN(inputDate)) {
                return next(new HttpError('Invalid date format.', 400));
            }
            
            // Para filtrar por todos los turnos que ocurren durante ese día (sin importar hora)
            const nextDay = new Date(inputDate);
            nextDay.setDate(nextDay.getDate() + 1);
        
            filter.date = { $gte: inputDate, $lt: nextDay };
        }
    
        totalAppointments = await Appointment.countDocuments(filter);
        appointments = await Appointment.find(filter)
            .populate([
                { path: 'patient', select: 'name' },
                { path: 'doctor', select: 'name specialty'}
            ])
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber)
            .sort({ date: 1 });
        
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
        currentPage: pageNumber
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

    const { patient, doctor, date } = req.body;
    const state = req.body.state || 'confirmed'; // El turno por default está confirmado
    
    const inputDate = new Date(date);
    
    let existingAppointment;
    try {
        existingAppointment = await Appointment.findOne({ doctor, date: inputDate });
    } catch (err) {
        return next(new HttpError('Could not check appointment availability.', 500));
    }

    if (existingAppointment) {
        return next(new HttpError('This doctor already has an appointment at this exact day and time.', 422));
    }

    // // Validación de sobrecarga de doctor (hasta 10 turnos por día)
    // try {
    //     const startOfDay = new Date(inputDate);
    //     startOfDay.setHours(0, 0, 0, 0);

    //     const endOfDay = new Date(inputDate);
    //     endOfDay.setHours(23, 59, 59, 999);

    //     const dailyCount = await Appointment.countDocuments({ 
    //         doctor, 
    //         date: { $gte: startOfDay, $lte: endOfDay }
    //     });

    //     if (dailyCount >= 10) {
    //         return next(new HttpError('This doctor already has 10 appointments on this day.', 422));
    //     }
    // } catch (err) {
    //     return next(new HttpError('Could not set the appointment, please try again later.', 500));
    // }

    let patientObj;
    let doctorObj;
    try {
        patientObj = await Patient.findById(patient);

        if (!patientObj) {
        return next(new HttpError('Patient not found.', 404));
        }
    } catch (err) {
        return next(new HttpError('Fetching patient failed.', 500));
    }

    try {
        doctorObj = await Doctor.findById(doctor);

        if (!doctorObj) {
        return next(new HttpError('Doctor not found.', 404));
        }

        if (doctorObj.active !== 'active') {
            return next(new HttpError('Cannot assign to an inactive doctor.', 400));
        }
    } catch (err) {
        return next(new HttpError('Fetching doctor failed.', 500));
    }

    const specialty = doctorObj.specialty; // Auto-set specialty from doctor

    const createdAppointment = new Appointment({
        patient: patientObj._id,
        doctor: doctorObj._id,
        specialty,
        date: inputDate,
        state
    });

    const sess = await mongoose.startSession();
    sess.startTransaction();
    try {    
        await createdAppointment.save({ session: sess });

        await Patient.updateOne(
            { _id: patientObj._id },
            { $push: { appointments: createdAppointment._id } },
            { session: sess }
        );
        
        await Doctor.updateOne(
            { _id: doctorObj._id },
            { $push: { appointments: createdAppointment._id } },
            { session: sess }
        );

        await sess.commitTransaction();
    } catch (err) {
        // console.log(err);
        return next(new HttpError('Creating appointment failed, please try again.', 500));
    } finally {
        await sess.endSession();
    }

    res.status(201).json({ appointment: createdAppointment.toObject({ getters: true }) });
};

const editAppointment = async (req, res, next) => {
    const { id } = req.params; 
    const inputDate = new Date(req.body.date);
    const updates = Object.keys(req.body);
    const allowedUpdates = ['patient', 'doctor', 'date', 'state'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return next(new HttpError('Invalid updates.', 400));
    }

    let appointment;
    try {
        appointment = await Appointment.findById(id).populate('patient').populate('doctor');        
    } catch (err) {
        return next(new HttpError('Fetching appointment failed.', 500));
    }

    if (!appointment) {
        return next(new HttpError('Appointment not found.', 404));
    }

    // Cambio de paciente
    if (req.body.patient && !appointment.patient._id.equals(req.body.patient)) {
        let newPatient;
        try {
            newPatient = await Patient.findById(req.body.patient);
        } catch (err) {
            return next(new HttpError('Fetching patient failed.', 500));
        }
        
        if (!newPatient) {
            return next(new HttpError('Patient not found.', 404));
        }
    
        const sess = await mongoose.startSession();
        sess.startTransaction();
        try {            
            await Patient.updateOne(
                { _id: appointment.patient._id },
                { $pull: { appointments: appointment._id } },
                { session: sess }
            );

            await newPatient.updateOne(
                { _id: newPatient._id },
                { $push: { appointments: appointment._id } },
                { session: sess }
            );

            appointment.patient = newPatient._id;

            await appointment.save({ session: sess });

            await sess.commitTransaction();
        } catch (err) {
            return next(new HttpError('Updating patient appointment failed, please try again.', 500));
        }
    }

    // Cambio de doctor
    if (req.body.doctor && !appointment.doctor._id.equals(req.body.doctor)) {
        let newDoctor;
        try {
            newDoctor = await Doctor.findById(req.body.doctor);
        } catch (err) {
            return next(new HttpError('Fetching doctor failed.', 500));
        }
        
        if (!newDoctor) {
            return next(new HttpError('Doctor not found.', 404));
        }

        if (newDoctor.active !== 'active') {
            return next(new HttpError('Can not assign to an inactive doctor.', 400));
        }

        // Validación de sobrecarga de doctor (hasta 10 turnos por día)
        // try {
        //     const startOfDay = new Date(inputDate);
        //     startOfDay.setHours(0, 0, 0, 0);

        //     const endOfDay = new Date(inputDate);
        //     endOfDay.setHours(23, 59, 59, 999);

        //     const dailyCount = await Appointment.countDocuments({ 
        //         doctor, 
        //         date: { $gte: startOfDay, $lte: endOfDay }
        //     });

        //     if (dailyCount >= 10) {
        //         return next(new HttpError('This doctor already has 10 appointments on this day.', 422));
        //     }
        // } catch (err) {
        //     return next(new HttpError('Could not set the appointment, please try again later.', 500));
        // }
    
        try {
            const sess = await mongoose.startSession();
            sess.startTransaction();

            await Doctor.updateOne(
                { _id: appointment.doctor },
                { $pull: { appointments: appointment._id } },
                { session: sess }
            );
            await newDoctor.updateOne(
                { _id: newDoctor._id },
                { $push: { appointments: appointment._id } },
                { session: sess }
            );

            appointment.doctor = newDoctor._id;
            appointment.specialty = newDoctor.specialty; // Auto-set specialty
            // Para que no se asigne un turno de una especialidad a un doctor que no corresponde

            await appointment.save({ session: sess });

            await sess.commitTransaction();
        } catch (err) {
            return next(new HttpError('Updating doctor appointment failed, please try again.', 500));
        }
    }

    try {
        // Validación de un turno por día y horario por doctor (evitar duplicaciones)
        const conflictingAppointment = await Appointment.findOne({
            doctor: appointment.doctor,
            date: appointment.date,
            _id: { $ne: appointment._id }
        });

        if (conflictingAppointment) {
            return next(new HttpError('Doctor already has an appointment at this exact day and time.', 400));
        }

        // Resto de cambios (día+hora y confirmación/cancelación)
        updates.forEach(update => {
            if (update !== 'patient' && update !== 'doctor') {
                appointment[update] = req.body[update];
            }
        });

        await appointment.save();

        res.status(200).json({ message: 'Appointment updated successfully', appointment });
    } catch (err) {
        return next(new HttpError('Could not save changes, please try again later.', 500));
    } finally {
        await sess.endSession();
    }
};

exports.createAppointment = createAppointment;
exports.getAppointments = getAppointments;
exports.getAppointmentById = getAppointmentById;
exports.editAppointment = editAppointment;
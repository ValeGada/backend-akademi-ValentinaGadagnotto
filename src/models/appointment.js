const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Patient'
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Doctor'
    },
    specialty: { type: String, required: true },
    date: { type: Date, required: true },
    hour: { type: String, required: true },
    state: { type: Boolean, required: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('Appointment', productSchema);
const mongoose = require('mongoose');
const validator = require('validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { type: String, required: true },
    DNI: { type: Number, required: true },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true, 
        lowercase: true, 
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Invalid email provided');
            }
        }
    },
    phone_number: { 
        type: String, 
        validate: value => validator.isMobilePhone(value, 'any') // Nro de teléfono válido, proveniente de cualquier país
    },
    specialty: { type: String, required: true },
    active: { type: Boolean, default: true }
}, { 
    timestamps: true 
});

userSchema.virtual(
    'appointments', 
    {
        ref: 'Appointment',
        localField: '_id',
        foreignField: 'doctor'
    }
)

module.exports = mongoose.model('Doctor', userSchema);
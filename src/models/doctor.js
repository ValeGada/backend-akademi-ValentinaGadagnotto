const mongoose = require('mongoose');
const validator = require('validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { type: String, required: true },
    DNI: { 
        type: String, 
        unique: true,
        required: true,
        minlength: 7, 
        validate(value) {
            if (!/^\d+$/.test(value)) {
                throw new Error('DNI must contain only digits');
            }
            if (value.length < 7) {
                throw new Error('DNI must be at least 7 digits long');
            }
        }
    },
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
    specialty: { type: String, required: true },
    active: { type: String, enum: ['active', 'inactive'], required: true }
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
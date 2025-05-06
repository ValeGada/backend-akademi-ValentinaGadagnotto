const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { 
        type: String, 
        required: true, 
        trim: true 
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
    password: { 
        type: String,
        required: true,
        trim: true,
        minlength: 6,
        validate(value) {
            if (value.toLowerCase().includes('contraseña' || 'password')) {
                throw new Error('Password can not contain "contraseña" o "password"')
            }
        }
    },
    token: { 
        type: String, 
        required: true 
    },
    role: { type: String, enum: ['admin', 'reception'], required: true }
}, { 
    timestamps: true 
});

userSchema.pre('save', async function(next) {
    const user = this;
    
    if (user.isModified('password')){
        try { 
            user.password = await bcrypt.hash(user.password, 8);
        } catch (err) {
            return next(err);
        }
        next();
    }
});  

module.exports = mongoose.model('User', userSchema);
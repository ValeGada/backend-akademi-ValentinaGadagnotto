const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendRecoveryEmail = require('../emails/recovery-email');

const HttpError = require('../util/errors/http-error');
const User = require('../models/user');


const signUp = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid inputs, please check your data.', 422));
    }

    const { name, email, password, role } = req.body;
    
    let existingUser;
    try {
        existingUser = await User.findOne({ email });
    } catch (err) {
        return next(new HttpError('Could not create user, please try again later.', 500));
    }

    if (existingUser) {
        return next(new HttpError('It already exists a user with this email, please try to log in.', 422));
    }

    const createdUser = new User({
        name,
        email,
        password,
        role,
        tokens: []
    });

    try {
        await createdUser.save();
    } catch (err) {
        return next(new HttpError('Signing up failed, please try again later.', 500));
    }

    let token;
    try {
        token = jwt.sign(
            { userId: createdUser.id, email: createdUser.email }, 
            process.env.JWT_KEY,
            { expiresIn: '7d' }
        );
    } catch (err) {
        return next(new HttpError('Signing up failed, please try again later.', 500));
    }

    res.status(201).json({ 
        userId: createdUser.id, 
        email: createdUser.email, 
        role: createdUser.role,
        token
    });
};

const logIn = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid inputs, please check your data.', 422));
    }
    const { email, password } = req.body;
    
    let existingUser;
    try {
        existingUser = await User.findOne({ email });
    } catch (err) {
        return next(new HttpError('Logging in failed, please try again later.', 500));
    }

    if (!existingUser) {
        return next(new HttpError('Invalid credentials, could not log you in.', 403));
    }

    let isValidPassword;
    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password);
    } catch (err) {
        return next(new HttpError('Could not log you in, please check your credentials and try again.', 500));
    }

    if (!isValidPassword) {
        return next(new HttpError('Invalid credentials, could not log you in.', 403));
    }
    
    let token;
    try {
        token = jwt.sign(
            { userId: existingUser.id, email: existingUser.email, role: existingUser.role },
            process.env.JWT_KEY,
            { expiresIn: '7d' }
        );
    } catch (err) {
        return next(new HttpError('Logging failed, please try again later.', 500));
    }
    
    res.json({ 
        userId: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
        token
    });
};

const passwordRecovery = async (req, res, next) => {
    const { email } = req.body;

    let user;
    try {
        user = await User.findOne({ email });

        if (!user) {
            return next(new HttpError('No user found with that email.', 404));
        }
    } catch (err) {
        return next(new HttpError('Error trying to recover password.', 500));
    }

    let recoveryToken;
    try {
        recoveryToken = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_KEY,
            { expiresIn: '1h' }
        );
    } catch (err) {
        return next(new HttpError('Could not generate recovery token.', 500));
    }

    const link = `http://localhost:3000/password-recovery/${recoveryToken}`;

    try {
        await sendRecoveryEmail({
            email: user.email,
            name: user.name,
            link
        });
    } catch (err) {
        // console.error('Error al enviar el correo:', err);
        return next(new HttpError('Could not send recovery email.', 500));
    }

    res.status(200).json({ message: 'Recovery email sent.' });
};

const passwordReset = async (req, res, next) => {
    const { token, newPassword } = req.body;

    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.JWT_KEY);
    } catch (err) {
        return next(new HttpError('Invalid or expired token.', 403));
    }

    let user;
    try {
        user = await User.findById(decodedToken.userId);
        if (!user) return next(new HttpError('User not found.', 404));
    } catch (err) {
        return next(new HttpError('Error finding user.', 500));
    }

    try {
        user.password = await bcrypt.hash(newPassword, 8); // Podría ser 12, en el curso recomiendan 8
        await user.save();
    } catch (err) {
        return next(new HttpError('Could not reset password.', 500));
    }

    res.status(200).json({ message: 'Password has been reset.' });
};

const getUsers = async (req, res, next) => {
    const {page=1, limit=10} = req.query;
    
    let users;
    let totalUsers;

    const pageNumber = parseInt(page, 10); // 2do arg --> radix
    // radix --> la base del sistema numérico que se usa para interpretar el string (10 = base decimal) 
    // Buena práctica incluirlo
    const limitNumber = parseInt(limit, 10);

    if (isNaN(pageNumber) || pageNumber <= 0) {
        return next(new HttpError("Invalid page number", 400));
    }
    if (isNaN(limitNumber) || limitNumber <= 0) {
        return next(new HttpError("Invalid limit number", 400));
    }

    try {
        totalUsers = await User.countDocuments();

        users = await User.find({}, "-password")
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);
        
        if (users.length === 0) {
        return next(new HttpError("No users found", 404));
        }
    } catch (err) {
        return next(new HttpError("Fetching users failed.", 500));
    }
    res.json({
        users: users.map((user) => user.toObject({ getters: true })),
        totalUsers,
        totalPages: Math.ceil(totalUsers / limitNumber),
        currentPage: pageNumber,
    });
};

const logOut = async (req, res, next) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
        await req.user.save();

        res.send();
    } catch (err) {
        return next(new HttpError('Could not log out, please try again later.', 500));
    }
};

const editUser = async (req, res, next) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'role'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        updates.forEach(update => req.user[update] = req.body[update]);
        await req.user.save();
        res.send(req.user);
    } catch (err) {
        return next(new HttpError('Could not save changes, please try again later.', 500));
    }
}

const deleteUser = async (req, res, next) => {
    try {
        await req.user.deleteOne();
        res.send(req.user);
    } catch (err) {
        return next(new HttpError('Could not delete user, please try again later.', 500));
    }
}

exports.signUp = signUp;
exports.logIn = logIn;
exports.passwordRecovery = passwordRecovery;
exports.passwordReset = passwordReset;
exports.getUsers = getUsers;
exports.logOut = logOut;
exports.editUser = editUser;
exports.deleteUser = deleteUser;
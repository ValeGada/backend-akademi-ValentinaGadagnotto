const jwt = require('jsonwebtoken');
const User = require('../models/user');
const HttpError = require('../util/errors/http-error');

const checkAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if(!token){
            return next(new HttpError('No token provided', 401));
        }

        const decoded = jwt.verify(token, process.env.JWT_KEY);
        if (!decoded?.userId) {
            return next(new HttpError('Invalid token payload.', 403));
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            return next(new HttpError('User not found.', 404));
        }

        req.user = user;
        next();
    } catch (err) {
        // console.error('Auth error: ', err)
        return next(new HttpError('Authentication failed.', 403));
    }
};

module.exports = checkAuth;
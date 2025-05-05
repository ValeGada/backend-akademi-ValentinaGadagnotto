const User = require('../models/user');
const HttpError = require('../util/errors/http-error');

const checkAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(decoded.userId);
        if (user.role !== 'admin') {
            throw new Error('You are not allowed to continue. Only admin can access.');
        }
        
        req.user = user;
        next();
    } catch (err) {
        return next(new HttpError('Authentication failed', 403));
    }
};

module.exports = checkAdmin;
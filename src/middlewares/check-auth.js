const jwt = require('jsonwebtoken');
const User = require('../models/user');
const HttpError = require('../util/errors/http-error');

const checkAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if(!token){
            throw new Error('Authentication failed');
        }
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        // const user = await User.findOne({ userId: decoded.userId, 'tokens.token': token });
        const user = await User.findById(decoded.userId);

        if (!user) {
            throw new Error('User not found');
        }

        req.user = user;
        next();
    } catch (err) {
        console.error(err)
        return next(new HttpError('Authentication failed', 403));
    }
};

module.exports = checkAuth;
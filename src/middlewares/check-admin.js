const HttpError = require('../util/errors/http-error');

const checkAdmin = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
          throw new Error('Only admin can access.');
        }
        next();
    } catch (err) {
        console.error(err)
        return next(new HttpError('Authentication failed', 403));
    }
};

module.exports = checkAdmin;
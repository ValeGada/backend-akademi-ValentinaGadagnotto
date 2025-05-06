const express = require('express');

const usersControllers = require('../controllers/users-controllers');

const { userValidator, newPasswordValidator } = require('../util/validators/user-validator');
const checkAuth = require('../middlewares/check-auth');
const checkAdmin = require('../middlewares/check-admin');

const router = express.Router();

router.post('/login', usersControllers.logIn);

router.post('/password-recovery', usersControllers.passwordRecovery);

router.patch('/password-recovery/:recoveryToken', newPasswordValidator, usersControllers.passwordReset);

// Middlewares
router.use(checkAuth);
router.use(checkAdmin);

router.post('/signup', userValidator, usersControllers.signUp);

router.get('/', usersControllers.getUsers);

router.patch('/:id', userValidator, usersControllers.editUser);

router.delete('/:id', usersControllers.deleteUser);

module.exports = router;
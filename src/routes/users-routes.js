const express = require('express');
const { check } = require('express-validator');

const usersControllers = require('../controllers/users-controllers');

const { createUserValidator, newPasswordValidator } = require('../util/validators/user-validator');
const checkAuth = require('../middlewares/check-auth');
const checkAdmin = require('../middlewares/check-admin');

const router = express.Router();

router.post('/login', usersControllers.logIn);

router.post('/password-recovery', usersControllers.passwordRecovery);

router.patch('/password-recovery/:recoveryToken', newPasswordValidator, usersControllers.passwordReset);

// router.post('/logout', usersControllers.logOut);

router.use(checkAuth);
router.use(checkAdmin);

router.post('/signup', createUserValidator, usersControllers.signUp);

router.get('/users', usersControllers.getUsers);

router.patch('/users/:id', usersControllers.editUser);

router.delete('/users/:id', usersControllers.deleteUser);

module.exports = router;
const express = require('express');
const { check } = require('express-validator');

const usersControllers = require('../controllers/users-controllers');

const createUserValidator = require('../util/validators/user-validator');
const checkAuth = require('../middlewares/check-auth');
const checkAdmin = require('../middlewares/check-admin');

const router = express.Router();

router.post('/signup', createUserValidator, usersControllers.signUp);

router.post('/login', usersControllers.logIn);

router.post('/password-recovery', usersControllers.passwordRecovery);

router.patch('/password-recovery/:token', usersControllers.passwordReset);

router.use(checkAuth);
router.use(checkAdmin);

router.get('/users', usersControllers.getUsers);

router.post('/logout', usersControllers.logOut);

router.patch('/users/:id', usersControllers.editUser);

router.delete('/users/:id', usersControllers.deleteUser);

module.exports = router;
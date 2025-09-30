const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// Local Auth
router.post('/register', userController.register);
router.post('/login', userController.login);

// Google OAuth
router.post('/google', userController.googleAuth);

module.exports = router;

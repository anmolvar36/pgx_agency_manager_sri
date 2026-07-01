const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const authMiddleware = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/quick-login', authController.quickLogin);
router.get('/me', authMiddleware, authController.getMe);
router.put('/settings', authMiddleware, authController.updateSettings);
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;

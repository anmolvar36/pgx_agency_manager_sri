const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

router.get('/creators/unaffiliated', authMiddleware, userController.getUnaffiliatedCreators);
router.get('/managers/unaffiliated', authMiddleware, userController.getUnaffiliatedManagers);
router.get('/managers', authMiddleware, userController.getOtherManagers);
router.post('/terminate-contract', authMiddleware, userController.terminateContract);

module.exports = router;

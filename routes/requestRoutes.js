const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const authMiddleware = require('../middleware/auth');

router.post('/send', authMiddleware, requestController.sendRequest);
router.post('/invite-manager', authMiddleware, requestController.inviteManager);
router.get('/pending', authMiddleware, requestController.getPendingRequests);
router.get('/all', authMiddleware, requestController.getAllRequests);
router.put('/:requestId/respond', authMiddleware, requestController.respondRequest);
router.post('/respond/:requestId', authMiddleware, requestController.respondRequest);
router.delete('/cancel/:requestId', authMiddleware, requestController.cancelRequest);

module.exports = router;

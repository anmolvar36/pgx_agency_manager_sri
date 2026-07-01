const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/auth');

router.get('/contacts', authMiddleware, messageController.getContacts);
router.get('/:contactId', authMiddleware, messageController.getMessages);
router.post('/:contactId', authMiddleware, messageController.sendMessage);

module.exports = router;

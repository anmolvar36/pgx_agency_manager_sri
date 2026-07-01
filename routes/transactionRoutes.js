const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/auth');

router.post('/tip', authMiddleware, transactionController.sendTip);
router.get('/ledger', authMiddleware, transactionController.getLedger);

module.exports = router;

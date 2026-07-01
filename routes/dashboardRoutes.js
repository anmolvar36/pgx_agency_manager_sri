const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

router.get('/agency', authMiddleware, dashboardController.getAgencyDashboard);
router.get('/agency/managers', authMiddleware, dashboardController.getAgencyManagers);
router.get('/agency/direct-creators', authMiddleware, dashboardController.getAgencyDirectCreators);
router.get('/live', authMiddleware, dashboardController.getLiveCreators);
router.get('/manager', authMiddleware, dashboardController.getManagerDashboard);
router.get('/creator', authMiddleware, dashboardController.getCreatorDashboard);
router.post('/toggle-live', authMiddleware, dashboardController.toggleLive);

module.exports = router;

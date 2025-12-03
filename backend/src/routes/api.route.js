const express = require('express');
const router = express.Router();

const analyticsController = require('../controllers/analytics.controller');
const alertController = require('../controllers/alerts.controller');

// GET /api/v1/analytic
router.get('/analytics', analyticsController.getAnalyticsData);

// GET /api/v1/alerts
router.get('/alerts', alertController.getLiveAlerts);

module.exports = router;
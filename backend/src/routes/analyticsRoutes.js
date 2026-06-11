const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/auth');

// Get best-selling items
router.get('/:restaurantId/best-sellers', authMiddleware, analyticsController.getBestSellers);

// Get revenue by category
router.get('/:restaurantId/revenue-by-category', authMiddleware, analyticsController.getRevenueByCategory);

// Get peak hours
router.get('/:restaurantId/peak-hours', authMiddleware, analyticsController.getPeakHours);

// Get customer trends
router.get('/:restaurantId/customer-trends', authMiddleware, analyticsController.getCustomerTrends);

// Get performance metrics
router.get('/:restaurantId/performance', authMiddleware, analyticsController.getPerformanceMetrics);

module.exports = router;

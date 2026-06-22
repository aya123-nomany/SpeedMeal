const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { authMiddleware } = require('../middleware/auth');

// Get all staff
router.get('/:restaurantId/staff', authMiddleware, staffController.getStaff);

// Add staff
router.post('/:restaurantId/staff', authMiddleware, staffController.addStaff);

// Update staff
router.put('/:restaurantId/staff/:staffId', authMiddleware, staffController.updateStaff);

// Remove staff
router.delete('/:restaurantId/staff/:staffId', authMiddleware, staffController.removeStaff);

// Get activity logs
router.get('/:restaurantId/staff/:staffId/logs', authMiddleware, staffController.getActivityLogs);

// Log activity
router.post('/:restaurantId/staff/:staffId/logs', authMiddleware, staffController.logActivity);

module.exports = router;

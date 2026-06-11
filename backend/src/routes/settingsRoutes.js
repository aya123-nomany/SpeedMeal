const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/auth');

// Get settings
router.get('/:restaurantId/settings', authMiddleware, settingsController.getSettings);

// Update settings
router.put('/:restaurantId/settings', authMiddleware, settingsController.updateSettings);

// Get business hours
router.get('/:restaurantId/business-hours', authMiddleware, settingsController.getBusinessHours);

// Update business hours
router.put('/:restaurantId/business-hours', authMiddleware, settingsController.updateBusinessHours);

module.exports = router;

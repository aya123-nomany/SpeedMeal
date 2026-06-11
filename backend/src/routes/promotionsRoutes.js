const express = require('express');
const router = express.Router();
const promotionsController = require('../controllers/promotionsController');
const authMiddleware = require('../middleware/auth');

// Campaigns
router.post('/:restaurantId/campaigns', authMiddleware, promotionsController.createCampaign);
router.get('/:restaurantId/campaigns', authMiddleware, promotionsController.getCampaigns);

// Bundles
router.post('/:restaurantId/bundles', authMiddleware, promotionsController.createBundle);
router.get('/:restaurantId/bundles', authMiddleware, promotionsController.getBundles);

// Loyalty Program
router.post('/:restaurantId/loyalty', authMiddleware, promotionsController.createLoyaltyProgram);
router.get('/:restaurantId/loyalty', authMiddleware, promotionsController.getLoyaltyProgram);

// Customer Points
router.get('/:restaurantId/loyalty/:userId/points', authMiddleware, promotionsController.getCustomerPoints);
router.post('/:restaurantId/loyalty/:userId/points', authMiddleware, promotionsController.addPoints);

module.exports = router;

const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financialController');
const authMiddleware = require('../middleware/auth');

// Get earnings
router.get('/:restaurantId/earnings', authMiddleware, financialController.getEarnings);

// Get financial summary
router.get('/:restaurantId/summary', authMiddleware, financialController.getFinancialSummary);

// Get transactions
router.get('/:restaurantId/transactions', authMiddleware, financialController.getTransactions);

// Request payout
router.post('/:restaurantId/payouts', authMiddleware, financialController.requestPayout);

// Get payouts
router.get('/:restaurantId/payouts', authMiddleware, financialController.getPayouts);

// Record earnings
router.post('/:restaurantId/record-earnings', authMiddleware, financialController.recordEarnings);

module.exports = router;

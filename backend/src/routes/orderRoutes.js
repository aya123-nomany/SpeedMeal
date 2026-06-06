const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/auth');

router.post('/',                    authMiddleware, orderController.createOrder);
router.get('/user',                 authMiddleware, orderController.getUserOrders);
router.get('/my',                   authMiddleware, orderController.getUserOrders);
router.get('/:id',                  authMiddleware, orderController.getOrderById);
router.put('/:id/status',           authMiddleware, orderController.updateOrderStatus);
router.post('/payment-intent',      authMiddleware, orderController.createPaymentIntent);
router.post('/:id/reorder',         authMiddleware, orderController.reorder);

module.exports = router;

const express = require('express');
const router = express.Router();
const resController = require('../controllers/restaurantController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.get('/',           resController.getAllRestaurants);
router.get('/categories', resController.getCategories);
router.get('/:id',        resController.getRestaurantById);
router.post('/',          authMiddleware, roleMiddleware(['restaurant', 'admin']), resController.createRestaurant);
router.post('/menu',      authMiddleware, roleMiddleware(['restaurant', 'admin']), resController.addMenuItem);

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const [[{ totalRestaurants }]] = await db.execute('SELECT COUNT(*) AS totalRestaurants FROM restaurants WHERE isVerified = 1');
        const [[{ totalClients }]]     = await db.execute('SELECT COUNT(*) AS totalClients FROM users WHERE role = "client"');
        const [[{ totalDeliveries }]]  = await db.execute('SELECT COUNT(*) AS totalDeliveries FROM users WHERE role = "delivery" AND isVerified = 1');
        const [[{ totalOrders }]]      = await db.execute('SELECT COUNT(*) AS totalOrders FROM orders');
        const [[{ totalDishes }]]      = await db.execute('SELECT COUNT(*) AS totalDishes FROM menu_items WHERE isAvailable = 1');
        const [[{ totalCities }]]      = await db.execute('SELECT COUNT(DISTINCT city) AS totalCities FROM restaurants WHERE isVerified = 1 AND city IS NOT NULL AND city != ""');

        res.json({
            totalRestaurants: totalRestaurants || 0,
            totalClients: totalClients || 0,
            totalDeliveries: totalDeliveries || 0,
            totalOrders: totalOrders || 0,
            totalDishes: totalDishes || 0,
            totalCities: totalCities || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

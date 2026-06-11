const db = require('../config/db');

// Get best-selling items
exports.getBestSellers = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { limit = 10, days = 30 } = req.query;

        const [items] = await db.execute(
            `SELECT mi.id, mi.name, mi.price, SUM(oi.quantity) as total_sold, COUNT(DISTINCT oi.order_id) as order_count
             FROM menu_items mi
             JOIN order_items oi ON mi.id = oi.item_id
             JOIN orders o ON oi.order_id = o.id
             WHERE o.restaurant_id = ? AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
             GROUP BY mi.id
             ORDER BY total_sold DESC
             LIMIT ?`,
            [restaurantId, days, limit]
        );

        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get revenue breakdown by category
exports.getRevenueByCategory = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { days = 30 } = req.query;

        const [data] = await db.execute(
            `SELECT mi.category, SUM(oi.price * oi.quantity) as revenue, COUNT(*) as orders
             FROM menu_items mi
             JOIN order_items oi ON mi.id = oi.item_id
             JOIN orders o ON oi.order_id = o.id
             WHERE o.restaurant_id = ? AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
             GROUP BY mi.category
             ORDER BY revenue DESC`,
            [restaurantId, days]
        );

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get peak hours
exports.getPeakHours = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        const [hours] = await db.execute(
            `SELECT HOUR(created_at) as hour, COUNT(*) as order_count, SUM(total_price) as revenue
             FROM orders
             WHERE restaurant_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
             GROUP BY HOUR(created_at)
             ORDER BY hour ASC`,
            [restaurantId]
        );

        res.json(hours);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get customer trends
exports.getCustomerTrends = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        // Repeat customers
        const [repeat] = await db.execute(
            `SELECT user_id, COUNT(*) as order_count, SUM(total_price) as total_spent
             FROM orders
             WHERE restaurant_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
             GROUP BY user_id
             HAVING COUNT(*) > 1
             ORDER BY order_count DESC
             LIMIT 20`,
            [restaurantId]
        );

        // New customers
        const [newCustomers] = await db.execute(
            `SELECT COUNT(DISTINCT user_id) as new_customers
             FROM orders
             WHERE restaurant_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
            [restaurantId]
        );

        res.json({ repeatCustomers: repeat, newCustomersThisWeek: newCustomers[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get performance metrics
exports.getPerformanceMetrics = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        const [daily] = await db.execute(
            `SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(total_price) as revenue
             FROM orders
             WHERE restaurant_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
             GROUP BY DATE(created_at)
             ORDER BY date DESC`,
            [restaurantId]
        );

        const [avgRating] = await db.execute(
            `SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
             FROM reviews
             WHERE restaurant_id = ?`,
            [restaurantId]
        );

        const [orderStatus] = await db.execute(
            `SELECT status, COUNT(*) as count
             FROM orders
             WHERE restaurant_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
             GROUP BY status`,
            [restaurantId]
        );

        res.json({ daily, rating: avgRating[0], orderStatus });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = exports;

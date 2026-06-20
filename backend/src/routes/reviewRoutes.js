const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const db = require('../config/db');

// ── CREATE review ───────────────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { restaurant_id, order_id, rating, comment, driver_rating, driver_comment } = req.body;
        if (!restaurant_id || !order_id || !rating) {
            return res.status(400).json({ message: 'restaurant_id, order_id and rating are required' });
        }

        // Verify the order exists
        const [[order]] = await db.execute(
            'SELECT id, user_id, delivery_id, status FROM orders WHERE id = ?',
            [order_id]
        );

        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Check if it belongs to the user
        if (order.user_id !== req.user.id) {
            return res.status(403).json({ 
                message: `This order doesn't belong to you. Order owner: ${order.user_id}, You: ${req.user.id}` 
            });
        }
        
        // Use a more flexible status check or log it for debugging
        if (order.status !== 'delivered') {
            return res.status(403).json({ 
                message: `You can only review delivered orders. Current status in DB: "${order.status}"` 
            });
        }

        // Prevent duplicate review (Check if already reviewed restaurant)
        const [[existing]] = await db.execute(
            'SELECT id FROM reviews WHERE order_id = ? AND user_id = ?',
            [order_id, req.user.id]
        );

        if (existing) {
             // If already reviewed but wants to add driver rating, UPDATE the existing review
             if (driver_rating && existing) {
                 await db.execute(
                     'UPDATE reviews SET driver_rating = ?, driver_comment = ? WHERE id = ?',
                     [driver_rating, driver_comment || null, existing.id]
                 );
                 
                 // Update driver average rating
                 if (order.delivery_id) {
                     await db.execute(
                         'UPDATE users SET rating = (SELECT ROUND(AVG(driver_rating), 1) FROM reviews WHERE order_id IN (SELECT id FROM orders WHERE delivery_id = ?) AND driver_rating IS NOT NULL) WHERE id = ?',
                         [order.delivery_id, order.delivery_id]
                     );
                 }
                 
                 return res.status(200).json({ message: 'Review updated with driver rating', id: existing.id });
             } else {
                 return res.status(409).json({ message: 'Already reviewed this order' });
             }
        }

        const [result] = await db.execute(
            'INSERT INTO reviews (user_id, restaurant_id, order_id, rating, comment, driver_rating, driver_comment) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, restaurant_id, order_id, rating, comment || null, driver_rating || null, driver_comment || null]
        );

        // Update restaurant average rating
        await db.execute(
            'UPDATE restaurants SET rating = (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE restaurant_id = ?) WHERE id = ?',
            [restaurant_id, restaurant_id]
        );

        // Update driver average rating if provided
        if (order.delivery_id && driver_rating) {
            await db.execute(
                'UPDATE users SET rating = (SELECT ROUND(AVG(driver_rating), 1) FROM reviews WHERE order_id IN (SELECT id FROM orders WHERE delivery_id = ?) AND driver_rating IS NOT NULL) WHERE id = ?',
                [order.delivery_id, order.delivery_id]
            );
        }

        res.status(201).json({ message: 'Review submitted', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET restaurant reviews ──────────────────────────────────────────────────
router.get('/restaurant/:restaurantId', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT r.*, u.name AS user_name
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.restaurant_id = ?
             ORDER BY r.created_at DESC`,
            [req.params.restaurantId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET driver reviews ──────────────────────────────────────────────────────
router.get('/driver', authMiddleware, roleMiddleware(['delivery', 'admin']), async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT r.id, r.driver_rating, r.driver_comment, r.created_at, u.name AS user_name, o.id AS order_id
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             JOIN orders o ON r.order_id = o.id
             WHERE o.delivery_id = ? AND r.driver_rating IS NOT NULL
             ORDER BY r.created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET my reviews ──────────────────────────────────────────────────────────
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT r.*, res.name AS restaurant_name
             FROM reviews r
             JOIN restaurants res ON r.restaurant_id = res.id
             WHERE r.user_id = ?
             ORDER BY r.created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── UPDATE review ───────────────────────────────────────────────────────────
router.put('/:reviewId', authMiddleware, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const [[review]] = await db.execute(
            'SELECT id, restaurant_id FROM reviews WHERE id = ? AND user_id = ?',
            [req.params.reviewId, req.user.id]
        );
        if (!review) return res.status(404).json({ message: 'Review not found' });

        await db.execute(
            'UPDATE reviews SET rating = ?, comment = ? WHERE id = ?',
            [rating, comment, req.params.reviewId]
        );

        // Recalculate avg
        await db.execute(
            'UPDATE restaurants SET rating = (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE restaurant_id = ?) WHERE id = ?',
            [review.restaurant_id, review.restaurant_id]
        );

        res.json({ message: 'Review updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE review ───────────────────────────────────────────────────────────
router.delete('/:reviewId', authMiddleware, async (req, res) => {
    try {
        const [[review]] = await db.execute(
            'SELECT id, restaurant_id FROM reviews WHERE id = ? AND user_id = ?',
            [req.params.reviewId, req.user.id]
        );
        if (!review) return res.status(404).json({ message: 'Review not found' });

        await db.execute('DELETE FROM reviews WHERE id = ?', [req.params.reviewId]);

        await db.execute(
            'UPDATE restaurants SET rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews WHERE restaurant_id = ?), 0) WHERE id = ?',
            [review.restaurant_id, review.restaurant_id]
        );

        res.json({ message: 'Review deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Admin: moderate review ──────────────────────────────────────────────────
router.put('/:reviewId/moderate', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
    try {
        await db.execute('UPDATE reviews SET isModerated = TRUE WHERE id = ?', [req.params.reviewId]);
        res.json({ message: 'Review moderated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

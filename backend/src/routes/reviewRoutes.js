const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const db = require('../config/db');

// ── CREATE review ───────────────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { restaurant_id, order_id, rating, comment } = req.body;
        if (!restaurant_id || !order_id || !rating) {
            return res.status(400).json({ message: 'restaurant_id, order_id and rating are required' });
        }

        // Verify the order belongs to the user and is delivered
        const [[order]] = await db.execute(
            'SELECT id FROM orders WHERE id = ? AND user_id = ? AND status = "delivered"',
            [order_id, req.user.id]
        );
        if (!order) return res.status(403).json({ message: 'You can only review delivered orders' });

        // Prevent duplicate review
        const [[existing]] = await db.execute(
            'SELECT id FROM reviews WHERE order_id = ? AND user_id = ?',
            [order_id, req.user.id]
        );
        if (existing) return res.status(409).json({ message: 'Already reviewed this order' });

        const [result] = await db.execute(
            'INSERT INTO reviews (user_id, restaurant_id, order_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, restaurant_id, order_id, rating, comment || null]
        );

        // Update restaurant average rating
        await db.execute(
            'UPDATE restaurants SET rating = (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE restaurant_id = ?) WHERE id = ?',
            [restaurant_id, restaurant_id]
        );

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
             WHERE r.restaurant_id = ? AND r.isModerated = FALSE
             ORDER BY r.created_at DESC`,
            [req.params.restaurantId]
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

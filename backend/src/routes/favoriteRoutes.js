const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const db = require('../config/db');

// ── GET my favorites ────────────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [restaurants] = await db.execute(
            `SELECT f.id AS fav_id, r.*
             FROM favorites f
             JOIN restaurants r ON f.restaurant_id = r.id
             WHERE f.user_id = ? AND f.restaurant_id IS NOT NULL`,
            [req.user.id]
        );
        const [items] = await db.execute(
            `SELECT f.id AS fav_id, m.*, r.name AS restaurant_name
             FROM favorites f
             JOIN menu_items m ON f.item_id = m.id
             JOIN restaurants r ON m.restaurant_id = r.id
             WHERE f.user_id = ? AND f.item_id IS NOT NULL`,
            [req.user.id]
        );
        res.json({ restaurants, items });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── TOGGLE favorite restaurant ──────────────────────────────────────────────
router.post('/restaurant/:restaurantId', authMiddleware, async (req, res) => {
    try {
        const [[existing]] = await db.execute(
            'SELECT id FROM favorites WHERE user_id = ? AND restaurant_id = ?',
            [req.user.id, req.params.restaurantId]
        );

        if (existing) {
            await db.execute('DELETE FROM favorites WHERE id = ?', [existing.id]);
            return res.json({ liked: false, message: 'Removed from favorites' });
        }

        await db.execute(
            'INSERT INTO favorites (user_id, restaurant_id) VALUES (?, ?)',
            [req.user.id, req.params.restaurantId]
        );
        res.json({ liked: true, message: 'Added to favorites' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── TOGGLE favorite item ────────────────────────────────────────────────────
router.post('/item/:itemId', authMiddleware, async (req, res) => {
    try {
        const [[existing]] = await db.execute(
            'SELECT id FROM favorites WHERE user_id = ? AND item_id = ?',
            [req.user.id, req.params.itemId]
        );

        if (existing) {
            await db.execute('DELETE FROM favorites WHERE id = ?', [existing.id]);
            return res.json({ liked: false, message: 'Removed from favorites' });
        }

        await db.execute(
            'INSERT INTO favorites (user_id, item_id) VALUES (?, ?)',
            [req.user.id, req.params.itemId]
        );
        res.json({ liked: true, message: 'Added to favorites' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

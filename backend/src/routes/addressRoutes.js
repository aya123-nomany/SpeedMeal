const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const db = require('../config/db');

// ── GET my addresses ────────────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── ADD address ─────────────────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { label, address, latitude, longitude, is_default } = req.body;
        if (!address) return res.status(400).json({ message: 'Address is required' });

        // If setting as default, unset others
        if (is_default) {
            await db.execute('UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?', [req.user.id]);
        }

        const [result] = await db.execute(
            'INSERT INTO user_addresses (user_id, label, address, latitude, longitude, is_default) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, label || 'Home', address, latitude || null, longitude || null, is_default || false]
        );
        res.status(201).json({ message: 'Address added', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── UPDATE address ──────────────────────────────────────────────────────────
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { label, address, latitude, longitude, is_default } = req.body;

        const [[existing]] = await db.execute(
            'SELECT id FROM user_addresses WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if (!existing) return res.status(404).json({ message: 'Address not found' });

        if (is_default) {
            await db.execute('UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?', [req.user.id]);
        }

        await db.execute(
            'UPDATE user_addresses SET label = ?, address = ?, latitude = ?, longitude = ?, is_default = ? WHERE id = ?',
            [label, address, latitude || null, longitude || null, is_default || false, req.params.id]
        );
        res.json({ message: 'Address updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── SET default ─────────────────────────────────────────────────────────────
router.put('/:id/default', authMiddleware, async (req, res) => {
    try {
        await db.execute('UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?', [req.user.id]);
        await db.execute('UPDATE user_addresses SET is_default = TRUE WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: 'Default address updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE address ──────────────────────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await db.execute('DELETE FROM user_addresses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: 'Address deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const db = require('../config/db');

// ── VALIDATE coupon (client) ────────────────────────────────────────────────
router.post('/validate', authMiddleware, async (req, res) => {
    try {
        const { code, order_total } = req.body;
        if (!code) return res.status(400).json({ message: 'Coupon code required' });

        const [[coupon]] = await db.execute(
            'SELECT * FROM coupons WHERE code = ? AND is_active = TRUE',
            [code.toUpperCase()]
        );

        if (!coupon) return res.status(404).json({ message: 'Invalid or expired coupon' });

        // Check expiry
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
            return res.status(400).json({ message: 'Coupon has expired' });
        }

        // Check max uses
        if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
            return res.status(400).json({ message: 'Coupon usage limit reached' });
        }

        // Check minimum order
        if (order_total < coupon.min_order) {
            return res.status(400).json({ message: `Minimum order of ${coupon.min_order} MAD required` });
        }

        // Check if user already used it
        const [[used]] = await db.execute(
            'SELECT id FROM coupon_usages WHERE coupon_id = ? AND user_id = ?',
            [coupon.id, req.user.id]
        );
        if (used) return res.status(409).json({ message: 'You already used this coupon' });

        // Calculate discount
        let discount = coupon.discount_type === 'percentage'
            ? (order_total * coupon.discount_value) / 100
            : coupon.discount_value;

        discount = Math.min(discount, order_total); // can't exceed total

        res.json({
            valid: true,
            coupon_id: coupon.id,
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            discount_amount: Number(discount).toFixed(2),
            message: `Coupon applied! You save ${Number(discount).toFixed(2)} MAD`
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── ADMIN: list all coupons ─────────────────────────────────────────────────
router.get('/', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM coupons ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── ADMIN: create coupon ────────────────────────────────────────────────────
router.post('/', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
    try {
        const { code, discount_type, discount_value, min_order, max_uses, expires_at } = req.body;
        const [result] = await db.execute(
            'INSERT INTO coupons (code, discount_type, discount_value, min_order, max_uses, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
            [code.toUpperCase(), discount_type, discount_value, min_order || 0, max_uses || null, expires_at || null]
        );
        res.status(201).json({ message: 'Coupon created', id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Coupon code already exists' });
        res.status(500).json({ error: err.message });
    }
});

// ── ADMIN: toggle coupon active ─────────────────────────────────────────────
router.put('/:id/toggle', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
    try {
        await db.execute('UPDATE coupons SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
        res.json({ message: 'Coupon status toggled' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── ADMIN: delete coupon ────────────────────────────────────────────────────
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
    try {
        await db.execute('DELETE FROM coupons WHERE id = ?', [req.params.id]);
        res.json({ message: 'Coupon deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

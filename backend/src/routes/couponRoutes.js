
const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const db = require('../config/db');

// Helper function to get restaurant ID from user ID
async function getRestaurantId(userId) {
    const [[resto]] = await db.execute(
        'SELECT id FROM restaurants WHERE owner_id = ?',
        [userId]
    );
    return resto?.id;
}

// ── VALIDATE coupon (client) ────────────────────────────────────────────────
router.post('/validate', authMiddleware, async (req, res) => {
    try {
        const { code, order_total, restaurant_id } = req.body;
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

        // Check if coupon is accepted by restaurant (for admin-created coupons)
        if (coupon.creator_type === 'admin' && restaurant_id) {
            const [[acceptance]] = await db.execute(
                'SELECT status FROM coupon_restaurants WHERE coupon_id = ? AND restaurant_id = ?',
                [coupon.id, restaurant_id]
            );
            if (!acceptance || acceptance.status !== 'accepted') {
                return res.status(400).json({ message: 'This coupon is not accepted by this restaurant' });
            }
        }
        // Check if coupon is from a different restaurant
        if (coupon.creator_type === 'restaurant' && restaurant_id) {
            const [[resto]] = await db.execute(
                'SELECT id FROM restaurants WHERE owner_id = ?',
                [coupon.creator_id]
            );
            if (resto?.id !== restaurant_id) {
                return res.status(400).json({ message: 'This coupon is not valid for this restaurant' });
            }
        }

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
        const [rows] = await db.execute(`
            SELECT c.*, 
                   COUNT(cr.restaurant_id) as total_restaurants,
                   SUM(CASE WHEN cr.status = 'accepted' THEN 1 ELSE 0 END) as accepted_restaurants
            FROM coupons c
            LEFT JOIN coupon_restaurants cr ON c.id = cr.coupon_id
            GROUP BY c.id
            ORDER BY c.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── ADMIN: create coupon ────────────────────────────────────────────────────
router.post('/', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { code, discount_type, discount_value, min_order, max_uses, expires_at } = req.body;
        
        // Create coupon
        const [result] = await connection.execute(
            'INSERT INTO coupons (code, discount_type, discount_value, min_order, max_uses, expires_at, creator_id, creator_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [code.toUpperCase(), discount_type, discount_value, min_order || 0, max_uses || null, expires_at || null, req.user.id, 'admin']
        );
        const couponId = result.insertId;

        // Get all restaurants
        const [restaurants] = await connection.execute('SELECT id FROM restaurants');

        // Create coupon_restaurant entries for all (pending status)
        for (const resto of restaurants) {
            await connection.execute(
                'INSERT INTO coupon_restaurants (coupon_id, restaurant_id, status) VALUES (?, ?, ?)',
                [couponId, resto.id, 'pending']
            );

            // Create notification for restaurant owner
            const [[owner]] = await connection.execute(
                'SELECT owner_id FROM restaurants WHERE id = ?',
                [resto.id]
            );
            if (owner) {
                await connection.execute(
                    'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
                    [owner.owner_id, 'Nouveau coupon disponible !', `Un nouveau coupon "${code.toUpperCase()}" a été créé par l'administration. Veuillez accepter ou refuser.`, 'coupon']
                );

                // Emit socket notification
                const io = req.app.get('io');
                if (io) {
                    io.to(`user_${owner.owner_id}`).emit('notification', {
                        title: 'Nouveau coupon disponible !',
                        message: `Un nouveau coupon "${code.toUpperCase()}" a été créé par l'administration.`,
                        type: 'coupon',
                        couponId: couponId
                    });
                }
            }
        }

        await connection.commit();
        res.status(201).json({ message: 'Coupon created and notifications sent', id: couponId });
    } catch (err) {
        await connection.rollback();
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Coupon code already exists' });
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
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

// ── RESTAURANT: get my coupons + pending admin coupons ──────────────────────
router.get('/restaurant/my', authMiddleware, roleMiddleware(['restaurant']), async (req, res) => {
    try {
        const restaurantId = await getRestaurantId(req.user.id);
        if (!restaurantId) return res.status(404).json({ message: 'Restaurant not found' });

        // Get restaurant's own coupons
        const [myCoupons] = await db.execute(
            'SELECT * FROM coupons WHERE creator_id = ? AND creator_type = ? ORDER BY created_at DESC',
            [req.user.id, 'restaurant']
        );

        // Get admin coupons with acceptance status
        const [adminCoupons] = await db.execute(`
            SELECT c.*, cr.status as acceptance_status, cr.responded_at
            FROM coupons c
            JOIN coupon_restaurants cr ON c.id = cr.coupon_id
            WHERE cr.restaurant_id = ? AND c.creator_type = ?
            ORDER BY c.created_at DESC
        `, [restaurantId, 'admin']);

        res.json({ myCoupons, adminCoupons });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── RESTAURANT: create my own coupon/deal ───────────────────────────────────
router.post('/restaurant/my', authMiddleware, roleMiddleware(['restaurant']), async (req, res) => {
    try {
        const { code, discount_type, discount_value, min_order, max_uses, expires_at } = req.body;
        
        const [result] = await db.execute(
            'INSERT INTO coupons (code, discount_type, discount_value, min_order, max_uses, expires_at, creator_id, creator_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [code.toUpperCase(), discount_type, discount_value, min_order || 0, max_uses || null, expires_at || null, req.user.id, 'restaurant']
        );
        
        res.status(201).json({ message: 'Coupon created', id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Coupon code already exists' });
        res.status(500).json({ error: err.message });
    }
});

// ── RESTAURANT: accept/decline admin coupon ─────────────────────────────────
router.put('/restaurant/accept/:couponId', authMiddleware, roleMiddleware(['restaurant']), async (req, res) => {
    try {
        const restaurantId = await getRestaurantId(req.user.id);
        if (!restaurantId) return res.status(404).json({ message: 'Restaurant not found' });

        const { status } = req.body;
        if (!['accepted', 'declined'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        await db.execute(
            'UPDATE coupon_restaurants SET status = ?, responded_at = NOW() WHERE coupon_id = ? AND restaurant_id = ?',
            [status, req.params.couponId, restaurantId]
        );

        res.json({ message: `Coupon ${status}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── RESTAURANT: toggle my coupon active ─────────────────────────────────────
router.put('/restaurant/toggle/:id', authMiddleware, roleMiddleware(['restaurant']), async (req, res) => {
    try {
        const restaurantId = await getRestaurantId(req.user.id);
        if (!restaurantId) return res.status(404).json({ message: 'Restaurant not found' });

        await db.execute(
            'UPDATE coupons SET is_active = NOT is_active WHERE id = ? AND creator_id = ? AND creator_type = ?',
            [req.params.id, req.user.id, 'restaurant']
        );
        
        res.json({ message: 'Coupon status toggled' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── RESTAURANT: delete my coupon ────────────────────────────────────────────
router.delete('/restaurant/my/:id', authMiddleware, roleMiddleware(['restaurant']), async (req, res) => {
    try {
        await db.execute(
            'DELETE FROM coupons WHERE id = ? AND creator_id = ? AND creator_type = ?',
            [req.params.id, req.user.id, 'restaurant']
        );
        res.json({ message: 'Coupon deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;


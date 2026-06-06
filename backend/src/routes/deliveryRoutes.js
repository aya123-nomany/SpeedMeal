const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const db = require('../config/db');

const isDelivery = [authMiddleware, roleMiddleware(['delivery', 'admin'])];

// ── GET available orders (unassigned, confirmed) ────────────────────────────
router.get('/available-orders', isDelivery, async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT o.*, r.name AS restaurant_name, r.address AS restaurant_address,
                    r.latitude AS rest_lat, r.longitude AS rest_lng,
                    u.name AS client_name, u.phone AS client_phone
             FROM orders o
             JOIN restaurants r ON o.restaurant_id = r.id
             JOIN users u ON o.user_id = u.id
             WHERE o.status = 'preparing' AND o.delivery_id IS NULL
             ORDER BY o.created_at DESC`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET my active deliveries ────────────────────────────────────────────────
router.get('/my-deliveries', isDelivery, async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT o.*, r.name AS restaurant_name, r.address AS restaurant_address,
                    r.latitude AS rest_lat, r.longitude AS rest_lng,
                    u.name AS client_name, u.phone AS client_phone
             FROM orders o
             JOIN restaurants r ON o.restaurant_id = r.id
             JOIN users u ON o.user_id = u.id
             WHERE o.delivery_id = ?
             ORDER BY o.created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── ACCEPT delivery order ───────────────────────────────────────────────────
router.post('/accept-order/:orderId', isDelivery, async (req, res) => {
    try {
        const { orderId } = req.params;
        // Check it's still available
        const [[order]] = await db.execute(
            'SELECT id, delivery_id FROM orders WHERE id = ? AND status = "preparing"',
            [orderId]
        );
        if (!order) return res.status(404).json({ message: 'Order not available' });
        if (order.delivery_id) return res.status(409).json({ message: 'Order already taken' });

        await db.execute(
            'UPDATE orders SET delivery_id = ?, status = "on_the_way" WHERE id = ?',
            [req.user.id, orderId]
        );

        // Notify via socket
        const io = req.app.get('io');
        if (io) {
            io.to(`order_${orderId}`).emit('orderStatusUpdate', { orderId, status: 'on_the_way' });
        }

        res.json({ message: 'Order accepted', orderId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── UPDATE delivery location ────────────────────────────────────────────────
router.post('/update-location/:orderId', isDelivery, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { latitude, longitude } = req.body;

        // Upsert location
        await db.execute(
            `INSERT INTO delivery_locations (delivery_id, order_id, latitude, longitude)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude), updated_at = NOW()`,
            [req.user.id, orderId, latitude, longitude]
        );

        // Broadcast live via socket
        const io = req.app.get('io');
        if (io) {
            io.to(`order_${orderId}`).emit('driverLocationUpdate', {
                orderId, latitude, longitude, deliveryId: req.user.id
            });
        }

        res.json({ message: 'Location updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── COMPLETE delivery ───────────────────────────────────────────────────────
router.put('/complete/:orderId', isDelivery, async (req, res) => {
    try {
        const { orderId } = req.params;
        await db.execute(
            'UPDATE orders SET status = "delivered", payment_status = "paid" WHERE id = ? AND delivery_id = ?',
            [orderId, req.user.id]
        );

        const io = req.app.get('io');
        if (io) {
            io.to(`order_${orderId}`).emit('orderStatusUpdate', { orderId, status: 'delivered' });
        }

        res.json({ message: 'Delivery completed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET delivery stats / earnings ──────────────────────────────────────────
router.get('/stats', isDelivery, async (req, res) => {
    try {
        const [[{ total }]] = await db.execute(
            'SELECT COUNT(*) AS total FROM orders WHERE delivery_id = ? AND status = "delivered"',
            [req.user.id]
        );
        const [[{ earnings }]] = await db.execute(
            'SELECT COALESCE(SUM(total_price * 0.1), 0) AS earnings FROM orders WHERE delivery_id = ? AND status = "delivered"',
            [req.user.id]
        );
        const [[{ today }]] = await db.execute(
            'SELECT COUNT(*) AS today FROM orders WHERE delivery_id = ? AND status = "delivered" AND DATE(updated_at) = CURDATE()',
            [req.user.id]
        );
        res.json({ total, earnings: Number(earnings).toFixed(2), today });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET current driver location for an order ───────────────────────────────
router.get('/location/:orderId', authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT latitude, longitude, updated_at FROM delivery_locations WHERE order_id = ? ORDER BY updated_at DESC LIMIT 1',
            [req.params.orderId]
        );
        res.json(rows[0] || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

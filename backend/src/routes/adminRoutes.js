const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const db = require('../config/db');

const isAdmin = [authMiddleware, roleMiddleware(['admin'])];

// ── STATS ─────────────────────────────────────────────────────────────────────
router.get('/stats', isAdmin, async (req, res) => {
    try {
        const [[{ totalUsers }]]        = await db.execute('SELECT COUNT(*) AS totalUsers FROM users');
        const [[{ totalOrders }]]       = await db.execute('SELECT COUNT(*) AS totalOrders FROM orders');
        const [[{ totalRestaurants }]]  = await db.execute('SELECT COUNT(*) AS totalRestaurants FROM restaurants');
        const [[{ totalDeliveries }]]   = await db.execute('SELECT COUNT(*) AS totalDeliveries FROM users WHERE role = "delivery"');
        const [[{ revenue }]]           = await db.execute("SELECT COALESCE(SUM(total_price),0) AS revenue FROM orders WHERE payment_status='paid'");
        const [[{ pendingOrders }]]     = await db.execute("SELECT COUNT(*) AS pendingOrders FROM orders WHERE status='pending'");
        const [[{ todayOrders }]]       = await db.execute("SELECT COUNT(*) AS todayOrders FROM orders WHERE DATE(created_at) = CURDATE()");
        const [[{ todayRevenue }]]      = await db.execute("SELECT COALESCE(SUM(total_price),0) AS todayRevenue FROM orders WHERE DATE(created_at) = CURDATE() AND payment_status='paid'");

        res.json({ totalUsers, totalOrders, totalRestaurants, totalDeliveries, revenue, pendingOrders, todayOrders, todayRevenue });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── USERS ─────────────────────────────────────────────────────────────────────
router.get('/users', isAdmin, async (req, res) => {
    try {
        const { role, search } = req.query;
        let q = 'SELECT id, name, email, role, phone, isActive, created_at FROM users WHERE 1=1';
        const p = [];
        if (role) { q += ' AND role = ?'; p.push(role); }
        if (search) { q += ' AND (name LIKE ? OR email LIKE ?)'; p.push(`%${search}%`, `%${search}%`); }
        q += ' ORDER BY created_at DESC';
        const [rows] = await db.execute(q, p);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/users/:id', isAdmin, async (req, res) => {
    try {
        await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/users/:id/toggle', isAdmin, async (req, res) => {
    try {
        await db.execute('UPDATE users SET isActive = NOT isActive WHERE id = ?', [req.params.id]);
        res.json({ message: 'User status toggled' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/users/:id/role', isAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
        res.json({ message: 'Role updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── ORDERS ────────────────────────────────────────────────────────────────────
router.get('/orders', isAdmin, async (req, res) => {
    try {
        const { status, search } = req.query;
        let q = `SELECT o.*, u.name AS user_name, r.name AS restaurant_name,
                        d.name AS driver_name
                 FROM orders o
                 JOIN users u ON o.user_id = u.id
                 JOIN restaurants r ON o.restaurant_id = r.id
                 LEFT JOIN users d ON o.delivery_id = d.id
                 WHERE 1=1`;
        const p = [];
        if (status) { q += ' AND o.status = ?'; p.push(status); }
        if (search) { q += ' AND (u.name LIKE ? OR r.name LIKE ?)'; p.push(`%${search}%`, `%${search}%`); }
        q += ' ORDER BY o.created_at DESC';
        const [rows] = await db.execute(q, p);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/orders/:id/status', isAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        await db.execute('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
        const io = req.app.get('io');
        if (io) io.to(`order_${req.params.id}`).emit('orderStatusUpdate', { orderId: req.params.id, status });
        res.json({ message: 'Status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── RESTAURANTS ───────────────────────────────────────────────────────────────
router.get('/restaurants', isAdmin, async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT r.*, u.name AS owner_name, u.email AS owner_email
             FROM restaurants r
             JOIN users u ON r.owner_id = u.id
             ORDER BY r.created_at DESC`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/restaurants/:id/toggle', isAdmin, async (req, res) => {
    try {
        await db.execute('UPDATE restaurants SET isOpen = NOT isOpen WHERE id = ?', [req.params.id]);
        res.json({ message: 'Restaurant status toggled' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/restaurants/:id', isAdmin, async (req, res) => {
    try {
        await db.execute('DELETE FROM restaurants WHERE id = ?', [req.params.id]);
        res.json({ message: 'Restaurant deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── REVIEWS (moderation) ──────────────────────────────────────────────────────
router.get('/reviews', isAdmin, async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT r.*, u.name AS user_name, res.name AS restaurant_name
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             JOIN restaurants res ON r.restaurant_id = res.id
             ORDER BY r.created_at DESC`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/reviews/:id', isAdmin, async (req, res) => {
    try {
        await db.execute('DELETE FROM reviews WHERE id = ?', [req.params.id]);
        res.json({ message: 'Review deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── DELIVERY ZONES ────────────────────────────────────────────────────────────
router.get('/zones', isAdmin, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM delivery_zones ORDER BY city');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/zones', isAdmin, async (req, res) => {
    try {
        const { name, city, base_fee, fee_per_km, max_distance_km } = req.body;
        const [result] = await db.execute(
            'INSERT INTO delivery_zones (name, city, base_fee, fee_per_km, max_distance_km) VALUES (?, ?, ?, ?, ?)',
            [name, city, base_fee, fee_per_km, max_distance_km || 20]
        );
        res.status(201).json({ message: 'Zone created', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/zones/:id', isAdmin, async (req, res) => {
    try {
        const { name, city, base_fee, fee_per_km, max_distance_km, is_active } = req.body;
        await db.execute(
            'UPDATE delivery_zones SET name=?, city=?, base_fee=?, fee_per_km=?, max_distance_km=?, is_active=? WHERE id=?',
            [name, city, base_fee, fee_per_km, max_distance_km, is_active !== undefined ? is_active : true, req.params.id]
        );
        res.json({ message: 'Zone updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/zones/:id', isAdmin, async (req, res) => {
    try {
        await db.execute('DELETE FROM delivery_zones WHERE id = ?', [req.params.id]);
        res.json({ message: 'Zone deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── SEND NOTIFICATION to all users ───────────────────────────────────────────
router.post('/notify-all', isAdmin, async (req, res) => {
    try {
        const { title, message, type, role } = req.body;
        let q = 'SELECT id FROM users WHERE isActive = TRUE';
        const p = [];
        if (role) { q += ' AND role = ?'; p.push(role); }
        const [users] = await db.execute(q, p);

        for (const u of users) {
            await db.execute(
                'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
                [u.id, title, message, type || 'system']
            );
        }

        const io = req.app.get('io');
        if (io) {
            io.emit('notification', { title, message, type });
        }

        res.json({ message: `Notification sent to ${users.length} users` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── COMMISSIONS overview ──────────────────────────────────────────────────────
router.get('/commissions', isAdmin, async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT r.id, r.name AS restaurant_name,
                    COUNT(o.id) AS total_orders,
                    COALESCE(SUM(o.total_price), 0) AS total_revenue,
                    COALESCE(SUM(o.total_price) * 0.15, 0) AS commission_15pct
             FROM restaurants r
             LEFT JOIN orders o ON r.id = o.restaurant_id AND o.status = 'delivered'
             GROUP BY r.id
             ORDER BY total_revenue DESC`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

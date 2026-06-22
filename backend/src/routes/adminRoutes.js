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
        const userId = req.params.id;
        
        // Get user role before deletion
        const [[user]] = await db.execute('SELECT role FROM users WHERE id = ?', [userId]);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        // If restaurant user, also delete their restaurant record
        if (user.role === 'restaurant') {
            await db.execute('DELETE FROM restaurants WHERE owner_id = ?', [userId]);
        }
        
        // Delete the user
        await db.execute('DELETE FROM users WHERE id = ?', [userId]);
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

router.put('/users/:id/reset-password', isAdmin, async (req, res) => {
    try {
        const bcrypt = require('bcryptjs');
        const { password } = req.body;
        if (!password) return res.status(400).json({ message: 'Password required' });
        const hashed = await bcrypt.hash(password, 10);
        await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, req.params.id]);
        res.json({ message: 'Password reset successfully' });
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
             ORDER BY r.isVerified DESC, r.created_at DESC`
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

router.put('/restaurants/:id/verify', isAdmin, async (req, res) => {
    try {
        const { isVerified } = req.body;
        await db.execute('UPDATE restaurants SET isVerified = ? WHERE id = ?', [isVerified ? 1 : 0, req.params.id]);
        if (!isVerified) {
            // Also close it so it doesn't appear open when re-approved later
            await db.execute('UPDATE restaurants SET isOpen = 0 WHERE id = ?', [req.params.id]);
        }
        res.json({ message: isVerified ? 'Restaurant verified' : 'Restaurant unverified' });
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

// ── APPROVED DRIVERS list ─────────────────────────────────────────────────
router.get('/drivers', isAdmin, async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT u.id, u.name, u.email, u.phone, u.address, u.isActive, u.created_at,
                    u.vehicle_type, u.has_license, u.has_insurance, u.face_photo, u.is_available,
                    COUNT(o.id)                                    AS total_deliveries,
                    COALESCE(SUM(o.total_price), 0)                AS total_revenue,
                    SUM(o.status = 'delivered')                    AS delivered_count,
                    MAX(o.created_at)                              AS last_delivery
             FROM users u
             LEFT JOIN orders o ON o.delivery_id = u.id
             WHERE u.role = 'delivery' AND u.isVerified = TRUE
             GROUP BY u.id
             ORDER BY delivered_count DESC, u.created_at DESC`
        );
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PENDING APPROVALS ─────────────────────────────────────────────────────────

router.get('/pending/restaurants', isAdmin, async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT u.id AS user_id, u.name, u.email, u.phone, u.created_at,
                    r.id AS restaurant_id, r.name AS restaurant_name, r.address,
                    r.city, r.cuisine, r.description, r.image_url
             FROM users u
             LEFT JOIN restaurants r ON r.owner_id = u.id
             WHERE u.role = 'restaurant' AND u.isVerified = FALSE AND u.isActive = TRUE
             ORDER BY u.created_at DESC`
        );
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/pending/delivery', isAdmin, async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT id AS user_id, name, email, phone, address, created_at, isActive,
                    vehicle_type, has_license, has_insurance, face_photo
             FROM users
             WHERE role = 'delivery' AND isVerified = FALSE AND isActive = TRUE
             ORDER BY created_at DESC`
        );
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/pending/restaurants/:userId/approve', isAdmin, async (req, res) => {
    try {
        await db.execute('UPDATE users SET isVerified = TRUE, isActive = TRUE WHERE id = ?', [req.params.userId]);
        await db.execute('UPDATE restaurants SET isVerified = TRUE, isOpen = TRUE WHERE owner_id = ?', [req.params.userId]);
        await db.execute(
            'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
            [req.params.userId, '🎉 Compte approuvé !', "Votre restaurant a été approuvé par l'administration. Vous pouvez maintenant recevoir des commandes.", 'system']
        );
        const io = req.app.get('io');
        if (io) io.to(`user_${req.params.userId}`).emit('notification', { title: '🎉 Compte approuvé !', message: 'Votre restaurant a été approuvé.' });
        res.json({ message: 'Restaurant approved' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/pending/restaurants/:userId/reject', isAdmin, async (req, res) => {
    try {
        const { reason } = req.body;
        await db.execute('UPDATE users SET isActive = FALSE WHERE id = ?', [req.params.userId]);
        await db.execute(
            'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
            [req.params.userId, '❌ Demande refusée', reason || "Votre demande d'inscription en tant que restaurant a été refusée.", 'system']
        );
        res.json({ message: 'Restaurant rejected' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/pending/delivery/:userId/approve', isAdmin, async (req, res) => {
    try {
        await db.execute('UPDATE users SET isVerified = TRUE, isActive = TRUE WHERE id = ?', [req.params.userId]);
        await db.execute(
            'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
            [req.params.userId, '🚀 Compte livreur approuvé !', 'Votre compte livreur a été approuvé. Vous pouvez maintenant accepter des livraisons.', 'system']
        );
        const io = req.app.get('io');
        if (io) io.to(`user_${req.params.userId}`).emit('notification', { title: '🚀 Compte livreur approuvé !', message: 'Votre compte a été approuvé.' });
        res.json({ message: 'Driver approved' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/pending/delivery/:userId/reject', isAdmin, async (req, res) => {
    try {
        const { reason } = req.body;
        await db.execute('UPDATE users SET isActive = FALSE WHERE id = ?', [req.params.userId]);
        await db.execute(
            'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
            [req.params.userId, '❌ Demande refusée', reason || "Votre demande d'inscription en tant que livreur a été refusée.", 'system']
        );
        res.json({ message: 'Driver rejected' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

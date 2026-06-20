const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const db = require('../config/db');
const { createNotification } = require('./notificationRoutes');

const isOwner = [authMiddleware, roleMiddleware(['restaurant', 'admin'])];

// ── Helper: verify ownership ────────────────────────────────────────────────
const verifyOwner = async (restaurantId, userId, role) => {
    if (role === 'admin') return true;
    const [[r]] = await db.execute(
        'SELECT id FROM restaurants WHERE id = ? AND owner_id = ?',
        [restaurantId, userId]
    );
    return !!r;
};

// ── GET my restaurant ───────────────────────────────────────────────────────
router.get('/my-restaurant', isOwner, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM restaurants WHERE owner_id = ?',
            [req.user.id]
        );
        res.json(rows[0] || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── CREATE restaurant ───────────────────────────────────────────────────────
router.post('/create', isOwner, async (req, res) => {
    try {
        const { name, description, address, city, latitude, longitude, cuisine, image_url } = req.body;
        const [result] = await db.execute(
            'INSERT INTO restaurants (owner_id, name, description, address, city, latitude, longitude, cuisine, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, name, description, address, city, latitude || null, longitude || null, cuisine, image_url || null]
        );
        res.status(201).json({ message: 'Restaurant created', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── UPDATE restaurant info ──────────────────────────────────────────────────
router.put('/:restaurantId', isOwner, async (req, res) => {
    try {
        const ok = await verifyOwner(req.params.restaurantId, req.user.id, req.user.role);
        if (!ok) return res.status(403).json({ message: 'Not your restaurant' });

        const { name, description, address, city, latitude, longitude, cuisine, image_url, isOpen } = req.body;
        await db.execute(
            'UPDATE restaurants SET name=?, description=?, address=?, city=?, latitude=?, longitude=?, cuisine=?, image_url=?, isOpen=? WHERE id=?',
            [name, description, address, city, latitude || null, longitude || null, cuisine, image_url || null, isOpen !== undefined ? isOpen : true, req.params.restaurantId]
        );
        res.json({ message: 'Restaurant updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── TOGGLE open/close ───────────────────────────────────────────────────────
router.put('/:restaurantId/toggle-status', isOwner, async (req, res) => {
    try {
        const ok = await verifyOwner(req.params.restaurantId, req.user.id, req.user.role);
        if (!ok) return res.status(403).json({ message: 'Not your restaurant' });
        await db.execute('UPDATE restaurants SET isOpen = NOT isOpen WHERE id = ?', [req.params.restaurantId]);
        res.json({ message: 'Status toggled' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET menu items ──────────────────────────────────────────────────────────
router.get('/:restaurantId/menu', isOwner, async (req, res) => {
    try {
        const ok = await verifyOwner(req.params.restaurantId, req.user.id, req.user.role);
        if (!ok) return res.status(403).json({ message: 'Not your restaurant' });
        const [rows] = await db.execute(
            'SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY category, name',
            [req.params.restaurantId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── ADD menu item ───────────────────────────────────────────────────────────
router.post('/:restaurantId/menu', isOwner, async (req, res) => {
    try {
        const ok = await verifyOwner(req.params.restaurantId, req.user.id, req.user.role);
        if (!ok) return res.status(403).json({ message: 'Not your restaurant' });

        const { name, description, price, category, image_url } = req.body;
        const [result] = await db.execute(
            'INSERT INTO menu_items (restaurant_id, name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?, ?)',
            [req.params.restaurantId, name, description || null, price, category || 'Autres', image_url || null]
        );
        res.status(201).json({ message: 'Item added', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── UPDATE menu item ────────────────────────────────────────────────────────
router.put('/:restaurantId/menu/:itemId', isOwner, async (req, res) => {
    try {
        const ok = await verifyOwner(req.params.restaurantId, req.user.id, req.user.role);
        if (!ok) return res.status(403).json({ message: 'Not your restaurant' });

        const { name, description, price, category, image_url, isAvailable } = req.body;
        await db.execute(
            'UPDATE menu_items SET name=?, description=?, price=?, category=?, image_url=?, isAvailable=? WHERE id=? AND restaurant_id=?',
            [name, description || null, price, category, image_url || null, isAvailable !== undefined ? isAvailable : true, req.params.itemId, req.params.restaurantId]
        );
        res.json({ message: 'Item updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE menu item ────────────────────────────────────────────────────────
router.delete('/:restaurantId/menu/:itemId', isOwner, async (req, res) => {
    try {
        const ok = await verifyOwner(req.params.restaurantId, req.user.id, req.user.role);
        if (!ok) return res.status(403).json({ message: 'Not your restaurant' });

        await db.execute('DELETE FROM menu_items WHERE id = ? AND restaurant_id = ?', [req.params.itemId, req.params.restaurantId]);
        res.json({ message: 'Item deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET restaurant orders ───────────────────────────────────────────────────
router.get('/:restaurantId/orders', isOwner, async (req, res) => {
    try {
        const ok = await verifyOwner(req.params.restaurantId, req.user.id, req.user.role);
        if (!ok) return res.status(403).json({ message: 'Not your restaurant' });

        const [orders] = await db.execute(
            `SELECT o.*, u.name AS client_name, u.phone AS client_phone
             FROM orders o
             JOIN users u ON o.user_id = u.id
             WHERE o.restaurant_id = ?
             ORDER BY o.created_at DESC`,
            [req.params.restaurantId]
        );

        // Get items for each order
        for (const order of orders) {
            const [items] = await db.execute(
                `SELECT oi.*, m.name AS item_name
                 FROM order_items oi
                 JOIN menu_items m ON oi.item_id = m.id
                 WHERE oi.order_id = ?`,
                [order.id]
            );
            order.items = items;
        }

        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── ACCEPT / REFUSE order ───────────────────────────────────────────────────
router.put('/:restaurantId/orders/:orderId/status', isOwner, async (req, res) => {
    try {
        const ok = await verifyOwner(req.params.restaurantId, req.user.id, req.user.role);
        if (!ok) return res.status(403).json({ message: 'Not your restaurant' });

        const { status } = req.body; // 'accepted' | 'preparing' | 'ready' | 'cancelled'
        const validStatuses = ['accepted', 'preparing', 'ready', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Use: accepted, preparing, ready or cancelled' });
        }

        const [[order]] = await db.execute('SELECT id, user_id FROM orders WHERE id = ? AND restaurant_id = ?',
            [req.params.orderId, req.params.restaurantId]
        );

        await db.execute('UPDATE orders SET status = ? WHERE id = ? AND restaurant_id = ?',
            [status, req.params.orderId, req.params.restaurantId]
        );

        const io = req.app.get('io');
        if (io) {
            io.to(`order_${req.params.orderId}`).emit('orderStatusUpdate', {
                orderId: req.params.orderId, status
            });
        }

        const statusMessages = {
            accepted: 'Votre commande a été acceptée par le restaurant',
            preparing: 'Votre commande est en cours de préparation',
            ready: 'Votre commande est prête et attend un livreur',
            cancelled: 'Votre commande a été annulée.',
        };

        if (statusMessages[status]) {
            await createNotification(order.user_id, 'Mise à jour commande', statusMessages[status], 'order', io);
        }

        res.json({ message: 'Order status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET restaurant stats ────────────────────────────────────────────────────
router.get('/:restaurantId/stats', isOwner, async (req, res) => {
    try {
        const ok = await verifyOwner(req.params.restaurantId, req.user.id, req.user.role);
        if (!ok) return res.status(403).json({ message: 'Not your restaurant' });

        const [[{ totalOrders }]] = await db.execute(
            'SELECT COUNT(*) AS totalOrders FROM orders WHERE restaurant_id = ?',
            [req.params.restaurantId]
        );
        const [[{ revenue }]] = await db.execute(
            'SELECT COALESCE(SUM(total_price), 0) AS revenue FROM orders WHERE restaurant_id = ? AND status = "delivered"',
            [req.params.restaurantId]
        );
        const [[{ pendingOrders }]] = await db.execute(
            'SELECT COUNT(*) AS pendingOrders FROM orders WHERE restaurant_id = ? AND status = "pending"',
            [req.params.restaurantId]
        );
        const [[{ avgRating }]] = await db.execute(
            'SELECT COALESCE(AVG(rating), 0) AS avgRating FROM reviews WHERE restaurant_id = ?',
            [req.params.restaurantId]
        );

        // Monthly revenue
        const [monthly] = await db.execute(
            `SELECT MONTH(created_at) AS month, COALESCE(SUM(total_price), 0) AS revenue
             FROM orders WHERE restaurant_id = ? AND status = "delivered" AND YEAR(created_at) = YEAR(NOW())
             GROUP BY MONTH(created_at)`,
            [req.params.restaurantId]
        );

        // Top items
        const [topItems] = await db.execute(
            `SELECT m.name, SUM(oi.quantity) AS total_sold
             FROM order_items oi
             JOIN menu_items m ON oi.item_id = m.id
             JOIN orders o ON oi.order_id = o.id
             WHERE o.restaurant_id = ? AND o.status = "delivered"
             GROUP BY m.id ORDER BY total_sold DESC LIMIT 5`,
            [req.params.restaurantId]
        );

        res.json({ totalOrders, revenue: Number(revenue).toFixed(2), pendingOrders, avgRating: Number(avgRating).toFixed(1), monthly, topItems });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── MANAGE opening hours ────────────────────────────────────────────────────
router.get('/:restaurantId/hours', async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM restaurant_hours WHERE restaurant_id = ? ORDER BY day_of_week',
            [req.params.restaurantId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/:restaurantId/hours', isOwner, async (req, res) => {
    try {
        const ok = await verifyOwner(req.params.restaurantId, req.user.id, req.user.role);
        if (!ok) return res.status(403).json({ message: 'Not your restaurant' });

        const { hours } = req.body; // array of { day_of_week, open_time, close_time, is_closed }
        await db.execute('DELETE FROM restaurant_hours WHERE restaurant_id = ?', [req.params.restaurantId]);

        for (const h of hours) {
            await db.execute(
                'INSERT INTO restaurant_hours (restaurant_id, day_of_week, open_time, close_time, is_closed) VALUES (?, ?, ?, ?, ?)',
                [req.params.restaurantId, h.day_of_week, h.open_time, h.close_time, h.is_closed || false]
            );
        }
        res.json({ message: 'Hours updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

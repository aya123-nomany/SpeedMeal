const db = require('../config/db');

// Get all staff members
exports.getStaff = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        const [staff] = await db.execute(
            `SELECT rs.*, u.name, u.email, u.phone FROM restaurant_staff rs
             JOIN users u ON rs.user_id = u.id
             WHERE rs.restaurant_id = ? AND rs.status = "active"
             ORDER BY rs.hired_date DESC`,
            [restaurantId]
        );

        res.json(staff);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Add staff member
exports.addStaff = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { email, role, salary, hiredDate } = req.body;

        // Check if user exists
        const [user] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userId = user[0].id;

        // Check if already a staff member
        const [existing] = await db.execute(
            'SELECT id FROM restaurant_staff WHERE restaurant_id = ? AND user_id = ?',
            [restaurantId, userId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'User is already staff member' });
        }

        const defaultPermissions = {
            manager: ['manage_orders', 'manage_menu', 'manage_staff', 'view_analytics'],
            cashier: ['manage_orders', 'process_payments'],
            kitchen: ['manage_orders', 'update_order_status'],
            delivery_coordinator: ['manage_orders', 'assign_delivery']
        };

        const [result] = await db.execute(
            `INSERT INTO restaurant_staff (restaurant_id, user_id, role, salary, hired_date, permissions)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [restaurantId, userId, role, salary || 0, hiredDate, JSON.stringify(defaultPermissions[role] || [])]
        );

        res.status(201).json({ message: 'Staff member added', staffId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update staff member
exports.updateStaff = async (req, res) => {
    try {
        const { restaurantId, staffId } = req.params;
        const { role, salary, permissions } = req.body;

        await db.execute(
            `UPDATE restaurant_staff SET role = ?, salary = ?, permissions = ?
             WHERE id = ? AND restaurant_id = ?`,
            [role, salary, JSON.stringify(permissions), staffId, restaurantId]
        );

        res.json({ message: 'Staff member updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Remove staff member
exports.removeStaff = async (req, res) => {
    try {
        const { restaurantId, staffId } = req.params;

        await db.execute(
            `UPDATE restaurant_staff SET status = "inactive"
             WHERE id = ? AND restaurant_id = ?`,
            [staffId, restaurantId]
        );

        res.json({ message: 'Staff member removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get staff activity logs
exports.getActivityLogs = async (req, res) => {
    try {
        const { restaurantId, staffId } = req.params;
        const { limit = 50 } = req.query;

        const [logs] = await db.execute(
            `SELECT * FROM staff_activity_logs
             WHERE restaurant_id = ? AND staff_id = ?
             ORDER BY created_at DESC LIMIT ?`,
            [restaurantId, staffId, parseInt(limit)]
        );

        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Log staff activity
exports.logActivity = async (req, res) => {
    try {
        const { restaurantId, staffId } = req.params;
        const { action, description, ipAddress } = req.body;

        await db.execute(
            `INSERT INTO staff_activity_logs (restaurant_id, staff_id, action, description, ip_address)
             VALUES (?, ?, ?, ?, ?)`,
            [restaurantId, staffId, action, description, ipAddress]
        );

        res.json({ message: 'Activity logged' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = exports;

const db = require('../config/db');

// Get restaurant settings
exports.getSettings = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        const [settings] = await db.execute(
            `SELECT id, delivery_radius_km, min_order_amount, delivery_fee_type, delivery_fee, estimated_delivery_time
             FROM restaurants WHERE id = ?`,
            [restaurantId]
        );

        if (settings.length === 0) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        res.json(settings[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update restaurant settings
exports.updateSettings = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { deliveryRadius, minOrderAmount, deliveryFeeType, deliveryFee, estimatedDeliveryTime } = req.body;

        await db.execute(
            `UPDATE restaurants 
             SET delivery_radius_km = ?, min_order_amount = ?, delivery_fee_type = ?, delivery_fee = ?, estimated_delivery_time = ?
             WHERE id = ?`,
            [deliveryRadius, minOrderAmount, deliveryFeeType, deliveryFee, estimatedDeliveryTime, restaurantId]
        );

        res.json({ message: 'Settings updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get business hours
exports.getBusinessHours = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        const [hours] = await db.execute(
            `SELECT * FROM business_hours WHERE restaurant_id = ? ORDER BY day_of_week`,
            [restaurantId]
        );

        res.json(hours);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update business hours
exports.updateBusinessHours = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { dayOfWeek, openTime, closeTime, isClosed } = req.body;

        await db.execute(
            `INSERT INTO business_hours (restaurant_id, day_of_week, open_time, close_time, is_closed)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             open_time = ?, close_time = ?, is_closed = ?`,
            [restaurantId, dayOfWeek, openTime, closeTime, isClosed, openTime, closeTime, isClosed]
        );

        res.json({ message: 'Business hours updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = exports;

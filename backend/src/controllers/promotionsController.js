const db = require('../config/db');

// Create promotional campaign
exports.createCampaign = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { name, description, type, discountType, discountValue, minOrderAmount, maxUses, startDate, endDate } = req.body;

        const [result] = await db.execute(
            `INSERT INTO promotion_campaigns 
             (restaurant_id, name, description, type, discount_type, discount_value, min_order_amount, max_uses, start_date, end_date, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [restaurantId, name, description, type, discountType, discountValue, minOrderAmount, maxUses, startDate, endDate, 'active']
        );

        res.status(201).json({ message: 'Campaign created', campaignId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get campaigns
exports.getCampaigns = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        const [campaigns] = await db.execute(
            `SELECT * FROM promotion_campaigns WHERE restaurant_id = ? ORDER BY created_at DESC`,
            [restaurantId]
        );

        res.json(campaigns);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create bundle deal
exports.createBundle = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { name, description, bundlePrice, discountPercentage, items } = req.body;

        const [result] = await db.execute(
            `INSERT INTO bundle_deals (restaurant_id, name, description, bundle_price, discount_percentage)
             VALUES (?, ?, ?, ?, ?)`,
            [restaurantId, name, description, bundlePrice, discountPercentage]
        );

        const bundleId = result.insertId;

        // Add bundle items
        for (const item of items) {
            await db.execute(
                `INSERT INTO bundle_items (bundle_id, menu_item_id, quantity)
                 VALUES (?, ?, ?)`,
                [bundleId, item.menuItemId, item.quantity]
            );
        }

        res.status(201).json({ message: 'Bundle created', bundleId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get bundles
exports.getBundles = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        const [bundles] = await db.execute(
            `SELECT * FROM bundle_deals WHERE restaurant_id = ? ORDER BY created_at DESC`,
            [restaurantId]
        );

        // Get items for each bundle
        for (const bundle of bundles) {
            const [items] = await db.execute(
                `SELECT bi.quantity, mi.name, mi.price FROM bundle_items bi
                 JOIN menu_items mi ON bi.menu_item_id = mi.id
                 WHERE bi.bundle_id = ?`,
                [bundle.id]
            );
            bundle.items = items;
        }

        res.json(bundles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create loyalty program
exports.createLoyaltyProgram = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { name, pointsPerPound, redemptionPoints, rewardAmount } = req.body;

        const [result] = await db.execute(
            `INSERT INTO loyalty_programs (restaurant_id, name, points_per_pound, redemption_points, reward_amount)
             VALUES (?, ?, ?, ?, ?)`,
            [restaurantId, name, pointsPerPound, redemptionPoints, rewardAmount]
        );

        res.status(201).json({ message: 'Loyalty program created', programId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get loyalty program
exports.getLoyaltyProgram = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        const [program] = await db.execute(
            `SELECT * FROM loyalty_programs WHERE restaurant_id = ? AND status = "active"`,
            [restaurantId]
        );

        res.json(program[0] || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get customer loyalty points
exports.getCustomerPoints = async (req, res) => {
    try {
        const { restaurantId, userId } = req.params;

        const [points] = await db.execute(
            `SELECT * FROM customer_loyalty_points WHERE restaurant_id = ? AND user_id = ?`,
            [restaurantId, userId]
        );

        res.json(points[0] || { points: 0, totalSpent: 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Add points to customer
exports.addPoints = async (req, res) => {
    try {
        const { restaurantId, userId } = req.params;
        const { points, amount } = req.body;

        await db.execute(
            `INSERT INTO customer_loyalty_points (restaurant_id, user_id, points, total_spent)
             VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE
             points = points + ?, total_spent = total_spent + ?`,
            [restaurantId, userId, points, amount, points, amount]
        );

        res.json({ message: 'Points added' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = exports;

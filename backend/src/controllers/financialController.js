const db = require('../config/db');

// Get restaurant earnings for a specific date or date range
exports.getEarnings = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { startDate, endDate } = req.query;

        let query = 'SELECT * FROM restaurant_earnings WHERE restaurant_id = ?';
        let params = [restaurantId];

        if (startDate && endDate) {
            query += ' AND date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        } else if (startDate) {
            query += ' AND date >= ?';
            params.push(startDate);
        }

        query += ' ORDER BY date DESC';

        const [earnings] = await db.execute(query, params);
        
        const totals = {
            totalRevenue: 0,
            totalCommission: 0,
            totalNetEarnings: 0,
            totalOrders: 0
        };

        earnings.forEach(e => {
            totals.totalRevenue += e.total_revenue;
            totals.totalCommission += e.commission_fee;
            totals.totalNetEarnings += e.net_earnings;
            totals.totalOrders += e.orders_count;
        });

        res.json({ earnings, totals });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get financial summary
exports.getFinancialSummary = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        const [today] = await db.execute(
            'SELECT * FROM restaurant_earnings WHERE restaurant_id = ? AND date = CURDATE()',
            [restaurantId]
        );

        const [thisMonth] = await db.execute(
            'SELECT SUM(total_revenue) as revenue, SUM(commission_fee) as commission, SUM(net_earnings) as earnings, SUM(orders_count) as orders FROM restaurant_earnings WHERE restaurant_id = ? AND MONTH(date) = MONTH(NOW()) AND YEAR(date) = YEAR(NOW())',
            [restaurantId]
        );

        const [thisYear] = await db.execute(
            'SELECT SUM(total_revenue) as revenue, SUM(commission_fee) as commission, SUM(net_earnings) as earnings, SUM(orders_count) as orders FROM restaurant_earnings WHERE restaurant_id = ? AND YEAR(date) = YEAR(NOW())',
            [restaurantId]
        );

        res.json({
            today: today[0] || { total_revenue: 0, commission_fee: 0, net_earnings: 0, orders_count: 0 },
            thisMonth: thisMonth[0],
            thisYear: thisYear[0]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get transaction history
exports.getTransactions = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const [transactions] = await db.execute(
            'SELECT * FROM restaurant_transactions WHERE restaurant_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [restaurantId, parseInt(limit), parseInt(offset)]
        );

        const [total] = await db.execute(
            'SELECT COUNT(*) as count FROM restaurant_transactions WHERE restaurant_id = ?',
            [restaurantId]
        );

        res.json({ transactions, total: total[0].count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Request payout
exports.requestPayout = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { amount, paymentMethod } = req.body;

        // Verify available balance
        const [balance] = await db.execute(
            'SELECT SUM(net_earnings) as total FROM restaurant_earnings WHERE restaurant_id = ?',
            [restaurantId]
        );

        const availableBalance = balance[0]?.total || 0;
        if (amount > availableBalance) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        const [result] = await db.execute(
            'INSERT INTO restaurant_payouts (restaurant_id, amount, payment_method, status) VALUES (?, ?, ?, ?)',
            [restaurantId, amount, paymentMethod, 'pending']
        );

        res.status(201).json({ message: 'Payout request created', payoutId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get payouts history
exports.getPayouts = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        const [payouts] = await db.execute(
            'SELECT * FROM restaurant_payouts WHERE restaurant_id = ? ORDER BY requested_date DESC',
            [restaurantId]
        );

        res.json(payouts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Calculate and create earnings record (called after order completion)
exports.recordEarnings = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { date } = req.body;

        const [orders] = await db.execute(
            'SELECT SUM(total_price) as total_revenue FROM orders WHERE restaurant_id = ? AND DATE(created_at) = ? AND status = "delivered"',
            [restaurantId, date]
        );

        const totalRevenue = orders[0]?.total_revenue || 0;
        const commissionPercentage = 15;
        const commissionFee = totalRevenue * (commissionPercentage / 100);
        const netEarnings = totalRevenue - commissionFee;

        const [orderCount] = await db.execute(
            'SELECT COUNT(*) as count FROM orders WHERE restaurant_id = ? AND DATE(created_at) = ? AND status = "delivered"',
            [restaurantId, date]
        );

        await db.execute(
            'INSERT INTO restaurant_earnings (restaurant_id, date, orders_count, total_revenue, commission_fee, net_earnings) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE orders_count = ?, total_revenue = ?, commission_fee = ?, net_earnings = ?',
            [restaurantId, date, orderCount[0].count, totalRevenue, commissionFee, netEarnings, orderCount[0].count, totalRevenue, commissionFee, netEarnings]
        );

        res.json({ message: 'Earnings recorded' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = exports;

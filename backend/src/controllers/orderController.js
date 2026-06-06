const db = require('../config/db');
const { createNotification } = require('../routes/notificationRoutes');

exports.createOrder = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const {
            restaurant_id, items, total_price, address,
            payment_method, coupon_id, discount_amount,
            note, delivery_time, stripe_payment_intent
        } = req.body;

        if (!restaurant_id || !items?.length || !total_price || !address || !payment_method) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Validate items still available & prices match
        for (const item of items) {
            const [[dbItem]] = await connection.execute(
                'SELECT id, price, isAvailable FROM menu_items WHERE id = ? AND restaurant_id = ?',
                [item.id, restaurant_id]
            );
            if (!dbItem) throw new Error(`Item ${item.id} not found`);
            if (!dbItem.isAvailable) throw new Error(`Item ${item.id} is not available`);
        }

        // 1. Create order
        const [orderResult] = await connection.execute(
            `INSERT INTO orders
             (user_id, restaurant_id, total_price, address, payment_method, coupon_id, discount_amount, note, delivery_time, stripe_payment_intent, payment_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.id, restaurant_id, total_price, address, payment_method,
                coupon_id || null, discount_amount || 0, note || null,
                delivery_time || null, stripe_payment_intent || null,
                payment_method === 'card' && stripe_payment_intent ? 'paid' : 'pending'
            ]
        );
        const orderId = orderResult.insertId;

        // 2. Add order items
        for (const item of items) {
            await connection.execute(
                'INSERT INTO order_items (order_id, item_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.id, item.quantity, item.price]
            );
        }

        // 3. Record coupon usage
        if (coupon_id) {
            await connection.execute(
                'INSERT INTO coupon_usages (coupon_id, user_id, order_id) VALUES (?, ?, ?)',
                [coupon_id, req.user.id, orderId]
            );
            await connection.execute(
                'UPDATE coupons SET used_count = used_count + 1 WHERE id = ?',
                [coupon_id]
            );
        }

        // 4. Add loyalty points (1 point per 10 MAD)
        const points = Math.floor(total_price / 10);
        if (points > 0) {
            await connection.execute(
                `INSERT INTO loyalty_points (user_id, points, total_earned)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE points = points + ?, total_earned = total_earned + ?`,
                [req.user.id, points, points, points, points]
            );
        }

        await connection.commit();

        // 5. Notify restaurant owner (async, don't block response)
        const [[restaurant]] = await db.execute(
            'SELECT owner_id, name FROM restaurants WHERE id = ?',
            [restaurant_id]
        );
        if (restaurant) {
            await createNotification(
                restaurant.owner_id,
                'Nouvelle commande!',
                `Commande #${orderId} reçue — ${Number(total_price).toFixed(2)} MAD`,
                'order'
            );

            // Socket notification
            const io = req.app.get('io');
            if (io) {
                io.to(`restaurant_${restaurant_id}`).emit('newOrder', { orderId, total_price });
            }
        }

        // 6. Notify client
        await createNotification(
            req.user.id,
            'Commande confirmée',
            `Votre commande #${orderId} a bien été reçue et est en cours de traitement.`,
            'order'
        );

        res.status(201).json({ message: 'Order placed successfully', orderId, points_earned: points });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};

exports.getUserOrders = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT o.*, r.name AS restaurant_name, r.image_url AS restaurant_image
             FROM orders o
             JOIN restaurants r ON o.restaurant_id = r.id
             WHERE o.user_id = ?
             ORDER BY o.created_at DESC`,
            [req.user.id]
        );

        // Get items for each order
        for (const order of rows) {
            const [items] = await db.execute(
                `SELECT oi.*, m.name AS item_name, m.image_url AS item_image
                 FROM order_items oi
                 JOIN menu_items m ON oi.item_id = m.id
                 WHERE oi.order_id = ?`,
                [order.id]
            );
            order.items = items;
        }

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const [[order]] = await db.execute(
            `SELECT o.*, r.name AS restaurant_name, r.address AS restaurant_address,
                    r.latitude AS rest_lat, r.longitude AS rest_lng,
                    r.image_url AS restaurant_image,
                    u.name AS client_name, u.phone AS client_phone,
                    d.name AS driver_name, d.phone AS driver_phone
             FROM orders o
             JOIN restaurants r ON o.restaurant_id = r.id
             JOIN users u ON o.user_id = u.id
             LEFT JOIN users d ON o.delivery_id = d.id
             WHERE o.id = ?`,
            [req.params.id]
        );

        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Only the owner, restaurant owner, assigned delivery or admin can see
        if (
            req.user.role !== 'admin' &&
            order.user_id !== req.user.id &&
            order.delivery_id !== req.user.id
        ) {
            // Check if requester is restaurant owner
            const [[rest]] = await db.execute(
                'SELECT owner_id FROM restaurants WHERE id = ?',
                [order.restaurant_id]
            );
            if (!rest || rest.owner_id !== req.user.id) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        const [items] = await db.execute(
            `SELECT oi.*, m.name AS item_name, m.image_url AS item_image, m.category
             FROM order_items oi
             JOIN menu_items m ON oi.item_id = m.id
             WHERE oi.order_id = ?`,
            [order.id]
        );
        order.items = items;

        // Get driver location if on the way
        if (order.status === 'on_the_way') {
            const [loc] = await db.execute(
                'SELECT latitude, longitude, updated_at FROM delivery_locations WHERE order_id = ? ORDER BY updated_at DESC LIMIT 1',
                [order.id]
            );
            order.driver_location = loc[0] || null;
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'preparing', 'on_the_way', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const [[order]] = await db.execute('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        await db.execute('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);

        // Notify client
        const statusMessages = {
            preparing:  'Votre commande est en cours de préparation 🍳',
            on_the_way: 'Votre commande est en route! 🛵',
            delivered:  'Votre commande a été livrée! Bon appétit 🎉',
            cancelled:  'Votre commande a été annulée.',
        };

        if (statusMessages[status]) {
            await createNotification(order.user_id, 'Mise à jour commande', statusMessages[status], 'order');
        }

        const io = req.app.get('io');
        if (io) {
            io.to(`order_${req.params.id}`).emit('orderStatusUpdate', { orderId: req.params.id, status });
        }

        res.json({ message: 'Order status updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create Stripe payment intent
exports.createPaymentIntent = async (req, res) => {
    try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const { amount } = req.body; // in MAD cents (e.g., 5000 = 50.00 MAD)

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // convert to centimes
            currency: 'mad',
            automatic_payment_methods: { enabled: true },
            metadata: { user_id: req.user.id.toString() }
        });

        res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Reorder: clone a past order
exports.reorder = async (req, res) => {
    try {
        const [[order]] = await db.execute(
            'SELECT * FROM orders WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const [items] = await db.execute(
            `SELECT oi.item_id AS id, oi.quantity, m.price, m.name, m.isAvailable
             FROM order_items oi
             JOIN menu_items m ON oi.item_id = m.id
             WHERE oi.order_id = ?`,
            [order.id]
        );

        // Filter out unavailable items
        const availableItems = items.filter(i => i.isAvailable);

        res.json({
            restaurant_id: order.restaurant_id,
            address: order.address,
            payment_method: order.payment_method,
            items: availableItems
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

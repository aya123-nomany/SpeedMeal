const db = require('../config/db');

// ── GET all restaurants with search + filter ────────────────────────────────
exports.getAllRestaurants = async (req, res) => {
    try {
        const { search, category, city, minRating, isOpen } = req.query;

        let query = 'SELECT * FROM restaurants WHERE isVerified = 1';
        const params = [];

        if (isOpen !== undefined) {
            query += ' AND isOpen = ?';
            params.push(isOpen === 'false' ? 0 : 1);
        }

        if (search) {
            query += ' AND (name LIKE ? OR cuisine LIKE ? OR city LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term);
        }

        if (category) {
            query += ' AND cuisine = ?';
            params.push(category);
        }

        if (city) {
            query += ' AND city LIKE ?';
            params.push(`%${city}%`);
        }

        if (minRating) {
            query += ' AND rating >= ?';
            params.push(Number(minRating));
        }

        query += ' ORDER BY rating DESC, created_at DESC';

        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ── GET restaurant by ID + menu ─────────────────────────────────────────────
exports.getRestaurantById = async (req, res) => {
    try {
        const [restaurants] = await db.execute('SELECT * FROM restaurants WHERE id = ?', [req.params.id]);
        if (restaurants.length === 0) return res.status(404).json({ message: 'Restaurant not found' });

        const [menuItems] = await db.execute(
            'SELECT * FROM menu_items WHERE restaurant_id = ? AND isAvailable = 1 ORDER BY category, name',
            [req.params.id]
        );

        // Get reviews summary
        const [[{ totalReviews, avgRating }]] = await db.execute(
            'SELECT COUNT(*) AS totalReviews, COALESCE(AVG(rating), 0) AS avgRating FROM reviews WHERE restaurant_id = ? AND isModerated = FALSE',
            [req.params.id]
        );

        // Get hours (optional — table may not exist)
        let hours = [];
        try {
            [hours] = await db.execute(
                'SELECT * FROM restaurant_hours WHERE restaurant_id = ? ORDER BY day_of_week',
                [req.params.id]
            );
        } catch (_) { /* table doesn't exist yet */ }

        // Group menu by category
        const menuByCategory = menuItems.reduce((acc, item) => {
            const cat = item.category || 'Autres';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(item);
            return acc;
        }, {});

        res.json({
            ...restaurants[0],
            menu: menuItems,
            menuByCategory,
            totalReviews,
            avgRating: Number(avgRating).toFixed(1),
            hours
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ── CREATE restaurant ───────────────────────────────────────────────────────
exports.createRestaurant = async (req, res) => {
    try {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            const { name, description, address, city, latitude, longitude, cuisine, image_url } = req.body;
            if (!name || !address) return res.status(400).json({ message: 'Name and address are required' });

            const [result] = await connection.execute(
                'INSERT INTO restaurants (owner_id, name, description, address, city, latitude, longitude, cuisine, image_url, isVerified, isOpen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)',
                [req.user.id, name, description || null, address, city || null, latitude || null, longitude || null, cuisine || null, image_url || null]
            );
            const restaurantId = result.insertId;
            
            // Add pending coupon_restaurant entries for all existing admin coupons
            const [adminCoupons] = await connection.execute('SELECT id, code FROM coupons WHERE creator_type = ?', ['admin']);
            for (const coupon of adminCoupons) {
                await connection.execute(
                    'INSERT INTO coupon_restaurants (coupon_id, restaurant_id, status) VALUES (?, ?, ?)',
                    [coupon.id, restaurantId, 'pending']
                );
                
                // Create notification for the new restaurant owner
                await connection.execute(
                    'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
                    [req.user.id, 'Nouveau coupon disponible !', `Un coupon "${coupon.code}" est disponible. Veuillez accepter ou refuser.`, 'coupon']
                );
                
                // Emit socket notification
                const io = req.app.get('io');
                if (io) {
                    io.to(`user_${req.user.id}`).emit('notification', {
                        title: 'Nouveau coupon disponible !',
                        message: `Un coupon "${coupon.code}" est disponible.`,
                        type: 'coupon',
                        couponId: coupon.id
                    });
                }
            }
            
            await connection.commit();
            
            res.status(201).json({ message: 'Restaurant created', id: restaurantId });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ── ADD menu item ───────────────────────────────────────────────────────────
exports.addMenuItem = async (req, res) => {
    try {
        const { restaurant_id, name, description, price, category, image_url } = req.body;
        if (!name || !price) return res.status(400).json({ message: 'Name and price are required' });

        const [result] = await db.execute(
            'INSERT INTO menu_items (restaurant_id, name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?, ?)',
            [restaurant_id, name, description || null, price, category || 'Autres', image_url || null]
        );
        res.status(201).json({ message: 'Menu item added', id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ── GET categories (distinct cuisines) ─────────────────────────────────────
exports.getCategories = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT DISTINCT cuisine FROM restaurants WHERE isVerified = 1 AND cuisine IS NOT NULL AND cuisine != "" ORDER BY cuisine'
        );
        res.json(rows.map(r => r.cuisine));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ── GET all menu categories (from all menu items) ──────────────────────────
exports.getMenuCategories = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT DISTINCT category FROM menu_items WHERE category IS NOT NULL AND category != "" ORDER BY category'
        );
        // For each category, also get a sample item image
        const categories = [];
        for (const r of rows) {
            const [sampleItems] = await db.execute(
                'SELECT image_url, price FROM menu_items WHERE category = ? AND image_url IS NOT NULL AND image_url != "" LIMIT 1',
                [r.category]
            );
            categories.push({
                name: r.category,
                image_url: sampleItems[0]?.image_url || null,
                sample_price: sampleItems[0]?.price || null
            });
        }
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

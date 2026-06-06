const db = require('../config/db');

// ── GET all restaurants with search + filter ────────────────────────────────
exports.getAllRestaurants = async (req, res) => {
    try {
        const { search, category, city, minRating, isOpen } = req.query;

        let query = 'SELECT * FROM restaurants WHERE 1=1';
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

        // Get hours
        const [hours] = await db.execute(
            'SELECT * FROM restaurant_hours WHERE restaurant_id = ? ORDER BY day_of_week',
            [req.params.id]
        );

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
        const { name, description, address, city, latitude, longitude, cuisine, image_url } = req.body;
        if (!name || !address) return res.status(400).json({ message: 'Name and address are required' });

        const [result] = await db.execute(
            'INSERT INTO restaurants (owner_id, name, description, address, city, latitude, longitude, cuisine, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, name, description || null, address, city || null, latitude || null, longitude || null, cuisine || null, image_url || null]
        );
        res.status(201).json({ message: 'Restaurant created', id: result.insertId });
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
            'SELECT DISTINCT cuisine FROM restaurants WHERE cuisine IS NOT NULL AND cuisine != "" ORDER BY cuisine'
        );
        res.json(rows.map(r => r.cuisine));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

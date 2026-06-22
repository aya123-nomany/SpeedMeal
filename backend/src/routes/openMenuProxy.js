const express = require('express');
const router  = express.Router();
const https   = require('https');

const API_KEY  = '2beef39a72e2a5b32321b2db5a774847645a63d2a59e0fc1241e62e962eeccab';
const OM_BASE  = 'https://www.openmenu.com/api/v2';

// Generic proxy helper — fetches OpenMenu and returns parsed JSON
const proxyGet = (endpoint, params) => {
    return new Promise((resolve, reject) => {
        const qs = new URLSearchParams({ key: API_KEY, ...params }).toString();
        const url = `${OM_BASE}/${endpoint}?${qs}`;

        https.get(url, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve(json);
                } catch (e) {
                    reject(new Error('Invalid JSON from OpenMenu'));
                }
            });
        }).on('error', reject);
    });
};

// Distance calculation (Haversine formula)
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

// ── GET /api/openmenu/search ────────────────────────────────────────────────
// ?s=sample&city=...&postal_code=...&country=US&offset=0&r=0&mi=0
router.get('/search', async (req, res) => {
    try {
        const { s = 'sample', city, postal_code, country, state, offset = 0, r, mi } = req.query;
        const params = { s, offset };
        if (city)        params.city        = city;
        if (postal_code) params.postal_code = postal_code;
        if (country)     params.country     = country;
        if (state)       params.state       = state;
        if (r)           params.r           = r;
        if (mi)          params.mi          = mi;

        const data = await proxyGet('search.php', params);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/openmenu/deals ─────────────────────────────────────────────────
// ?id=sample
router.get('/deals', async (req, res) => {
    try {
        const { id = 'sample' } = req.query;
        const data = await proxyGet('deals.php', { id });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/openmenu/ingredients ───────────────────────────────────────────
// ?s=chicken&offset=0
router.get('/ingredients', async (req, res) => {
    try {
        const { s = 'sample', offset = 0, food_group } = req.query;
        const params = { s, offset, nutrition: 1 };
        if (food_group) params.food_group = food_group;

        const data = await proxyGet('ingredients.php', params);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/openmenu/location ──────────────────────────────────────────────
// ?city=...&postal_code=...&country=US&offset=0
router.get('/location', async (req, res) => {
    try {
        const { city, postal_code, country, restaurant_name, offset = 0 } = req.query;
        const params = { offset };
        if (city)            params.city            = city;
        if (postal_code)     params.postal_code     = postal_code;
        if (country)         params.country         = country;
        if (restaurant_name) params.restaurant_name = restaurant_name;

        const data = await proxyGet('location.php', params);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/openmenu/nearby ─────────────────────────────────────────────────
// ?lat=...&lng=...&radius=5 (km)
router.get('/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = 5, country = 'MA' } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ error: 'lat and lng are required' });
        }

        // Fetch restaurants from OpenMenu (broad search by country)
        const data = await proxyGet('location.php', { country, offset: 0 });

        if (!data.response || !data.response.items) {
            return res.json({ items: [] });
        }

        // Filter restaurants by distance
        const nearbyRestaurants = data.response.items.filter(restaurant => {
            const restaurantLat = restaurant.lat || 33.5731;
            const restaurantLng = restaurant.lng || -7.5898;
            const distance = getDistance(parseFloat(lat), parseFloat(lng), restaurantLat, restaurantLng);
            return distance <= parseFloat(radius);
        });

        // Add distance to each restaurant
        const restaurantsWithDistance = nearbyRestaurants.map(restaurant => {
            const restaurantLat = restaurant.lat || 33.5731;
            const restaurantLng = restaurant.lng || -7.5898;
            const distance = getDistance(parseFloat(lat), parseFloat(lng), restaurantLat, restaurantLng);
            return {
                ...restaurant,
                distance: distance.toFixed(2)
            };
        });

        res.json({ items: restaurantsWithDistance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;


const db = require('./src/config/db');

async function check() {
    try {
        // Check restaurants
        const [restaurants] = await db.execute('SELECT * FROM restaurants');
        console.log('\n📊 Restaurants found:', restaurants.length);
        restaurants.forEach(r => console.log('  -', r.name, '(id:', r.id, ')'));

        // Check orders
        const [orders] = await db.execute('SELECT id, restaurant_id, status, total_price FROM orders');
        console.log('\n📦 Orders found:', orders.length);
        orders.forEach(o => console.log('  -', o.id, '| restaurant:', o.restaurant_id, '| status:', o.status, '| total:', o.total_price));

        // Check commissions query
        const [commissions] = await db.execute(
            `SELECT r.id, r.name AS restaurant_name,
                    COUNT(o.id) AS total_orders,
                    COALESCE(SUM(o.total_price), 0) AS total_revenue,
                    COALESCE(SUM(o.total_price) * 0.15, 0) AS commission_15pct
             FROM restaurants r
             LEFT JOIN orders o ON r.id = o.restaurant_id AND o.status = 'delivered'
             GROUP BY r.id
             ORDER BY total_revenue DESC`
        );
        console.log('\n💵 Commissions data:', commissions.length, 'rows');
        commissions.forEach(c => console.log('  -', c.restaurant_name, '| Orders:', c.total_orders, '| Revenue:', c.total_revenue, '| Commission:', c.commission_15pct));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}

check();


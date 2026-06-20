
const mysql = require('mysql2/promise');

async function migrate() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'speedmeal'
    });

    console.log('Migrating coupons system...');

    try {
        // 1. Create coupons table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS coupons (
                id INT PRIMARY KEY AUTO_INCREMENT,
                code VARCHAR(30) UNIQUE NOT NULL,
                discount_type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
                discount_value DECIMAL(10,2) NOT NULL,
                min_order DECIMAL(10,2) DEFAULT 0,
                max_uses INT DEFAULT NULL,
                used_count INT DEFAULT 0,
                expires_at DATETIME DEFAULT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                creator_id INT NULL,
                creator_type ENUM('admin', 'restaurant') DEFAULT 'admin',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_creator (creator_id, creator_type),
                INDEX idx_code (code)
            )
        `);
        console.log('Created coupons table.');

        // 2. Create coupon_usages table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS coupon_usages (
                id INT PRIMARY KEY AUTO_INCREMENT,
                coupon_id INT NOT NULL,
                user_id INT NOT NULL,
                order_id INT NOT NULL,
                used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            )
        `);
        console.log('Created coupon_usages table.');

        // 3. Create coupon_restaurants table to track acceptances
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS coupon_restaurants (
                id INT PRIMARY KEY AUTO_INCREMENT,
                coupon_id INT NOT NULL,
                restaurant_id INT NOT NULL,
                status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
                responded_at DATETIME NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
                FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
                UNIQUE KEY unique_coupon_restaurant (coupon_id, restaurant_id)
            )
        `);
        console.log('Created coupon_restaurants table.');
        
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await connection.end();
    }
}

migrate();

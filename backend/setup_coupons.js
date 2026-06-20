
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setup() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'speedmeal'
        });
        
        // Check if coupons table exists
        const [tables] = await connection.execute('SHOW TABLES LIKE "coupons"');
        if (tables.length === 0) {
            console.log('Creating coupons table...');
            await connection.execute(`
                CREATE TABLE coupons (
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
            console.log('✓ Coupons table created');
        }

        // Check if coupon_usages table exists
        const [usageTables] = await connection.execute('SHOW TABLES LIKE "coupon_usages"');
        if (usageTables.length === 0) {
            console.log('Creating coupon_usages table...');
            await connection.execute(`
                CREATE TABLE coupon_usages (
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
            console.log('✓ Coupon usages table created');
        }

        // Check if coupon_restaurants table exists
        const [acceptTables] = await connection.execute('SHOW TABLES LIKE "coupon_restaurants"');
        if (acceptTables.length === 0) {
            console.log('Creating coupon_restaurants table...');
            await connection.execute(`
                CREATE TABLE coupon_restaurants (
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
            console.log('✓ Coupon restaurants table created');
        }

        console.log('\n✨ Coupon system setup complete!');
        
    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (connection) await connection.end();
    }
}

setup();

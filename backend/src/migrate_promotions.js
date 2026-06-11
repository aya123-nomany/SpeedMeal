const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migratePromotions() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Creating promotions tables...');

        // Promotional Campaigns Table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS promotion_campaigns (
                id INT PRIMARY KEY AUTO_INCREMENT,
                restaurant_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                type ENUM('discount', 'bundle', 'loyalty', 'seasonal') DEFAULT 'discount',
                discount_type ENUM('percentage', 'fixed_amount') DEFAULT 'percentage',
                discount_value DECIMAL(10,2) NOT NULL,
                min_order_amount DECIMAL(10,2) DEFAULT 0,
                max_uses INT,
                uses_count INT DEFAULT 0,
                start_date DATETIME NOT NULL,
                end_date DATETIME NOT NULL,
                status ENUM('active', 'paused', 'ended') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✓ promotion_campaigns table created');

        // Bundle Deals Table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS bundle_deals (
                id INT PRIMARY KEY AUTO_INCREMENT,
                restaurant_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                bundle_price DECIMAL(10,2) NOT NULL,
                discount_percentage DECIMAL(5,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✓ bundle_deals table created');

        // Bundle Items Table (items included in a bundle)
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS bundle_items (
                id INT PRIMARY KEY AUTO_INCREMENT,
                bundle_id INT NOT NULL,
                menu_item_id INT NOT NULL,
                quantity INT DEFAULT 1,
                FOREIGN KEY (bundle_id) REFERENCES bundle_deals(id) ON DELETE CASCADE,
                FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✓ bundle_items table created');

        // Loyalty Programs Table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS loyalty_programs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                restaurant_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                points_per_pound DECIMAL(5,2) DEFAULT 1,
                redemption_points INT DEFAULT 100,
                reward_amount DECIMAL(10,2) DEFAULT 5,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✓ loyalty_programs table created');

        // Customer Loyalty Points Table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS customer_loyalty_points (
                id INT PRIMARY KEY AUTO_INCREMENT,
                restaurant_id INT NOT NULL,
                user_id INT NOT NULL,
                points INT DEFAULT 0,
                total_spent DECIMAL(10,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_restaurant_user (restaurant_id, user_id)
            )
        `);
        console.log('  ✓ customer_loyalty_points table created');

        await connection.end();
        console.log('Promotions migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration Error:', error.message);
        process.exit(1);
    }
}

migratePromotions();

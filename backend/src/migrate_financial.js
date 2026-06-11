const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrateFinancial() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Creating financial management tables...');

        // Restaurant Earnings Table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS restaurant_earnings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                restaurant_id INT NOT NULL,
                date DATE NOT NULL,
                orders_count INT DEFAULT 0,
                total_revenue DECIMAL(10,2) DEFAULT 0,
                commission_percentage DECIMAL(5,2) DEFAULT 15,
                commission_fee DECIMAL(10,2) DEFAULT 0,
                net_earnings DECIMAL(10,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
                UNIQUE KEY unique_restaurant_date (restaurant_id, date)
            )
        `);
        console.log('  ✓ restaurant_earnings table created');

        // Restaurant Transactions Table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS restaurant_transactions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                restaurant_id INT NOT NULL,
                type ENUM('order', 'refund', 'commission', 'adjustment', 'payout') DEFAULT 'order',
                amount DECIMAL(10,2) NOT NULL,
                description VARCHAR(255),
                reference_id INT,
                status ENUM('completed', 'pending', 'failed') DEFAULT 'completed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
                INDEX idx_restaurant_date (restaurant_id, created_at)
            )
        `);
        console.log('  ✓ restaurant_transactions table created');

        // Restaurant Payouts Table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS restaurant_payouts (
                id INT PRIMARY KEY AUTO_INCREMENT,
                restaurant_id INT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
                requested_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed_date TIMESTAMP NULL,
                payment_method VARCHAR(50),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✓ restaurant_payouts table created');

        await connection.end();
        console.log('Financial migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration Error:', error.message);
        process.exit(1);
    }
}

migrateFinancial();

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrateStaffAndSettings() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Creating staff and settings tables...');

        // Restaurant Staff Table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS restaurant_staff (
                id INT PRIMARY KEY AUTO_INCREMENT,
                restaurant_id INT NOT NULL,
                user_id INT NOT NULL,
                role ENUM('manager', 'cashier', 'kitchen', 'delivery_coordinator') DEFAULT 'cashier',
                salary DECIMAL(10,2) DEFAULT 0,
                permissions JSON,
                hired_date DATE,
                status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_staff (restaurant_id, user_id)
            )
        `);
        console.log('  ✓ restaurant_staff table created');

        // Staff Activity Logs Table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS staff_activity_logs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                restaurant_id INT NOT NULL,
                staff_id INT NOT NULL,
                action VARCHAR(100),
                description TEXT,
                ip_address VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
                FOREIGN KEY (staff_id) REFERENCES restaurant_staff(id) ON DELETE CASCADE,
                INDEX idx_staff_date (staff_id, created_at)
            )
        `);
        console.log('  ✓ staff_activity_logs table created');

        // Add columns to restaurants table for settings
        await connection.execute(`
            ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS 
            delivery_radius_km INT DEFAULT 5
        `);
        
        await connection.execute(`
            ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS 
            min_order_amount DECIMAL(10,2) DEFAULT 0
        `);
        
        await connection.execute(`
            ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS 
            delivery_fee_type ENUM('fixed', 'percentage') DEFAULT 'fixed'
        `);
        
        await connection.execute(`
            ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS 
            delivery_fee DECIMAL(10,2) DEFAULT 2.50
        `);
        
        await connection.execute(`
            ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS 
            estimated_delivery_time INT DEFAULT 30
        `);
        
        console.log('  ✓ restaurants table columns added');

        await connection.end();
        console.log('Staff and settings migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration Error:', error.message);
        process.exit(1);
    }
}

migrateStaffAndSettings();

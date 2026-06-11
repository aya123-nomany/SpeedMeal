const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrateBusinessHours() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Creating business hours table...');

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS business_hours (
                id INT PRIMARY KEY AUTO_INCREMENT,
                restaurant_id INT NOT NULL,
                day_of_week INT NOT NULL DEFAULT 1,
                open_time TIME,
                close_time TIME,
                is_closed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
                UNIQUE KEY unique_restaurant_day (restaurant_id, day_of_week)
            )
        `);

        console.log('  ✓ business_hours table created');
        await connection.end();
        console.log('Business hours migration completed!');
        process.exit(0);
    } catch (error) {
        console.error('Migration Error:', error.message);
        process.exit(1);
    }
}

migrateBusinessHours();

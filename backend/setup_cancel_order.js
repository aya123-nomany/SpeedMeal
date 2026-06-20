const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function setup() {
    try {
        // Add cancel_reason column to orders table
        await pool.query(`
            ALTER TABLE orders ADD COLUMN cancel_reason TEXT DEFAULT NULL
        `);
        console.log('✅ Added cancel_reason column to orders table');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️  Column cancel_reason already exists');
        } else {
            console.error('❌ Error:', err.message);
        }
    }
    await pool.end();
}

setup();

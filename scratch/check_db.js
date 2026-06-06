const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

async function checkDb() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        const [rows] = await connection.execute('SHOW TABLES');
        console.log('Tables:', rows);
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('DB Connection Error:', error.message);
        process.exit(1);
    }
}

checkDb();

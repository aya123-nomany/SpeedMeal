const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function initDb() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            multipleStatements: true
        });

        const sql = fs.readFileSync(path.join(__dirname, '../../database.sql'), 'utf8');
        console.log('Initializing database...');
        await connection.query(sql);
        console.log('Database initialized successfully!');
        
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('Initialization Error:', error.message);
        process.exit(1);
    }
}

initDb();

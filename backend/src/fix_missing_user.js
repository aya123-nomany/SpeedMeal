const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fixMissingUser() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const email = 'aya.noamany@gmail.com';
        const password = 'Test1234!';
        const role = 'restaurant';

        // Check if user exists
        const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
        
        if (existing.length > 0) {
            console.log('User already exists');
            await connection.end();
            process.exit(0);
        }

        // Hash password
        const hashed = await bcrypt.hash(password, 10);

        // Create user
        const [result] = await connection.execute(
            'INSERT INTO users (name, email, password, role, isVerified, isActive) VALUES (?, ?, ?, ?, ?, ?)',
            ['Restaurant Owner', email, hashed, role, true, true]
        );

        console.log('SUCCESS: Created user with ID:', result.insertId);
        console.log('Email:', email);
        console.log('Role:', role);
        console.log('Verified: true');
        console.log('Active: true');

        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

fixMissingUser();

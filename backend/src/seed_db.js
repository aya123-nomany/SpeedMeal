const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function seedDb() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Seeding restaurants...');
        
        // First, check if there's an owner user (id 1)
        const [users] = await connection.execute('SELECT id FROM users LIMIT 1');
        let ownerId;
        if (users.length === 0) {
            const [res] = await connection.execute(
                "INSERT INTO users (name, email, password, role) VALUES ('Admin', 'admin@speedmeal.com', 'hashedpassword', 'admin')"
            );
            ownerId = res.insertId;
        } else {
            ownerId = users[0].id;
        }

        const restaurants = [
            ["McDonald's", "Burgers and more", "Maroc Mall", "Casablanca", "Fast Food", 4.5, "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=300&q=80"],
            ["KFC", "Fried Chicken", "Twin Center", "Casablanca", "Fast Food", 4.2, "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80"],
            ["Pizza Hut", "Pizza & Pasta", "Boulevard d'Anfa", "Casablanca", "Pizza", 4.0, "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=80"]
        ];

        for (const [name, desc, addr, city, cuisine, rating, img] of restaurants) {
            await connection.execute(
                'INSERT INTO restaurants (owner_id, name, description, address, city, cuisine, rating, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [ownerId, name, desc, addr, city, cuisine, rating, img]
            );
        }

        console.log('Seeding completed!');
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('Seeding Error:', error.message);
        process.exit(1);
    }
}

seedDb();

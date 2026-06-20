
const mysql = require('mysql2/promise');

async function setup() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'speedmeal'
    });
    
    // Check if complaints table exists
    const [tables] = await connection.execute('SHOW TABLES LIKE "complaints"');
    if (tables.length === 0) {
      console.log('Creating complaints table...');
      await connection.execute(`
        CREATE TABLE complaints (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          order_id INT,
          restaurant_id INT,
          driver_id INT,
          target ENUM('restaurant', 'driver', 'site') NOT NULL DEFAULT 'site',
          subject VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          status ENUM('pending', 'in_review', 'resolved', 'dismissed') DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
          FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE SET NULL,
          FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL
        )
      `);
      console.log('✓ Complaints table created');
    }

    console.log('\n✨ Complaints system setup complete!');
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (connection) await connection.end();
  }
}

setup();

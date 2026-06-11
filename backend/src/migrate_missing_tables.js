const db = require('./config/db');

async function migrate() {
  try {
    console.log('Creating missing tables and columns...');
    
    // Create notifications table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        title VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('order', 'promo', 'system', 'delivery') DEFAULT 'system',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ notifications table created');
    
    // Add missing columns to users table
    await db.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS isVerified BOOLEAN DEFAULT FALSE
    `);
    console.log('✓ users.isVerified column added');
    
    await db.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS otp VARCHAR(6) NULL
    `);
    console.log('✓ users.otp column added');
    
    await db.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS otp_expiry DATETIME NULL
    `);
    console.log('✓ users.otp_expiry column added');
    
    await db.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50) NULL
    `);
    console.log('✓ users.vehicle_type column added');
    
    await db.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS has_license BOOLEAN DEFAULT FALSE
    `);
    console.log('✓ users.has_license column added');
    
    await db.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS has_insurance BOOLEAN DEFAULT FALSE
    `);
    console.log('✓ users.has_insurance column added');
    
    // Add missing column to restaurants table
    await db.execute(`
      ALTER TABLE restaurants 
      ADD COLUMN IF NOT EXISTS isVerified BOOLEAN DEFAULT FALSE
    `);
    console.log('✓ restaurants.isVerified column added');
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();

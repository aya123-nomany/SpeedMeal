const db = require('./config/db');

async function migrate() {
  try {
    console.log('Migrating complaints table to add target column...');
    
    // Check if target column already exists
    const [columns] = await db.execute(`
      SHOW COLUMNS FROM complaints LIKE 'target'
    `);
    
    if (columns.length === 0) {
      await db.execute(`
        ALTER TABLE complaints 
        ADD COLUMN target ENUM('restaurant', 'driver', 'site') NOT NULL DEFAULT 'site'
      `);
      console.log('✓ Added target column to complaints table');
    } else {
      console.log('✓ target column already exists in complaints table');
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();

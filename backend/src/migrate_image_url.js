const db = require('./config/db');

async function migrate() {
  try {
    console.log('Migrating image_url fields to TEXT...');
    
    // Change restaurants.image_url from VARCHAR(255) to TEXT
    await db.execute(`
      ALTER TABLE restaurants 
      MODIFY COLUMN image_url TEXT
    `);
    console.log('✓ restaurants.image_url migrated to TEXT');
    
    // Change menu_items.image_url from VARCHAR(255) to TEXT
    await db.execute(`
      ALTER TABLE menu_items 
      MODIFY COLUMN image_url TEXT
    `);
    console.log('✓ menu_items.image_url migrated to TEXT');
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();

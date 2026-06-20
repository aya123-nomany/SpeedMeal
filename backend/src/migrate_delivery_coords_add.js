const db = require('./config/db');

async function migrate() {
  try {
    console.log('Adding delivery_lat and delivery_lng columns to orders table...');
    
    await db.execute(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS delivery_lat DECIMAL(10,8) NULL,
      ADD COLUMN IF NOT EXISTS delivery_lng DECIMAL(11,8) NULL
    `);
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();

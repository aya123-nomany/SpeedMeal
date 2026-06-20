require('dotenv').config();
const db = require('./config/db');

async function run() {
  try {
    console.log('Adding delivery coordinates columns to orders table...');

    // Check if delivery_lat column exists
    const [columns] = await db.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = 'speedmeal' AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'delivery_lat'`
    );

    if (columns.length === 0) {
      await db.execute(`ALTER TABLE orders ADD COLUMN delivery_lat DECIMAL(10,7) NULL AFTER address`);
      await db.execute(`ALTER TABLE orders ADD COLUMN delivery_lng DECIMAL(10,7) NULL AFTER delivery_lat`);
      console.log('✅ Added delivery_lat and delivery_lng columns');
    } else {
      console.log('Columns already exist, skipping.');
    }

    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  }
}

run();

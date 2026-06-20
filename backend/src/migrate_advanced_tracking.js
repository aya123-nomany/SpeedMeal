require('dotenv').config({ path: '../.env' });
const db = require('./config/db');

async function run() {
  try {
    console.log('Running migration: updating orders status ENUM...');
    
    const newEnum = "'pending', 'accepted', 'preparing', 'ready', 'searching_driver', 'driver_assigned', 'driver_at_restaurant', 'on_the_way', 'delivered', 'cancelled'";
    
    await db.execute(`ALTER TABLE orders MODIFY COLUMN status ENUM(${newEnum}) DEFAULT 'pending'`);
    
    console.log('✅ Migration done — orders status ENUM updated successfully.');
    process.exit(0);
  } catch (e) {
    console.error('❌ Migration error:', e.message);
    process.exit(1);
  }
}
run();

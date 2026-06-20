require('dotenv').config();
const db = require('./config/db');

async function run() {
  try {
    console.log('Running migration: adding is_available column to users...');
    await db.execute('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE');
    console.log('✅ Migration done — is_available column added to users table');
    process.exit(0);
  } catch (e) {
    console.error('❌ Migration error:', e.message);
    process.exit(1);
  }
}
run();

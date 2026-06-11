require('dotenv').config();
const db = require('./config/db');

async function migrate() {
  try {
    // Add otp and otp_expiry columns to users table if they don't exist
    await db.execute(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS otp VARCHAR(6),
      ADD COLUMN IF NOT EXISTS otp_expiry DATETIME
    `);
    console.log('✅ Migration done — OTP columns added');
    process.exit(0);
  } catch (e) {
    console.error('❌ Migration error:', e.message);
    process.exit(1);
  }
}

migrate();

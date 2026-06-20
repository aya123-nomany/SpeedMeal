require('dotenv').config();
const db = require('./config/db');

async function run() {
  try {
    console.log('Running migration: adding delivery driver columns...');
    await db.execute('ALTER TABLE users ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50) NULL');
    await db.execute('ALTER TABLE users ADD COLUMN IF NOT EXISTS has_license VARCHAR(10) NULL');
    await db.execute('ALTER TABLE users ADD COLUMN IF NOT EXISTS has_insurance VARCHAR(10) NULL');
    await db.execute('ALTER TABLE users ADD COLUMN IF NOT EXISTS face_photo LONGTEXT NULL');
    console.log('✅ Migration done — vehicle_type, has_license, has_insurance, face_photo columns added');
    process.exit(0);
  } catch (e) {
    console.error('❌ Migration error:', e.message);
    process.exit(1);
  }
}
run();

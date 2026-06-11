require('dotenv').config();
const db = require('./config/db');

async function run() {
  try {
    await db.execute('ALTER TABLE users ADD COLUMN IF NOT EXISTS isVerified BOOLEAN DEFAULT FALSE');
    await db.execute('ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS isVerified BOOLEAN DEFAULT FALSE');
    // existing active restaurant owners and delivery users get auto-verified
    await db.execute("UPDATE users SET isVerified = TRUE WHERE role IN ('restaurant','delivery') AND isActive = TRUE");
    await db.execute('UPDATE restaurants SET isVerified = TRUE WHERE isOpen = TRUE OR created_at < NOW()');
    console.log('✅ Migration done — isVerified columns added');
    process.exit(0);
  } catch (e) {
    console.error('❌ Migration error:', e.message);
    process.exit(1);
  }
}
run();

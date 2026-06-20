const db = require('./config/db');

async function test() {
  try {
    const [rows] = await db.execute('SELECT id, name, role FROM users WHERE role = "admin" LIMIT 1');
    console.log('Admin user:', rows);
    process.exit(0);
  } catch (error) {
    console.error('Query failed:', error);
    process.exit(1);
  }
}

test();

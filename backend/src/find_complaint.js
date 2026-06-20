const db = require('./config/db');

async function test() {
  try {
    const [rows] = await db.execute('SELECT id, target, user_id FROM complaints LIMIT 5');
    console.log('Complaints in DB:', rows);
    process.exit(0);
  } catch (error) {
    console.error('Query failed:', error);
    process.exit(1);
  }
}

test();

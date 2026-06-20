const db = require('./config/db');

async function test() {
  try {
    const [rows] = await db.execute(
      `SELECT c.*, r.owner_id as restaurant_owner_id
       FROM complaints c
       LEFT JOIN restaurants r ON c.restaurant_id = r.id
       WHERE c.id = ?`,
      [1] // test with ID 1
    );
    console.log('Query result:', rows);
    process.exit(0);
  } catch (error) {
    console.error('Query failed:', error);
    process.exit(1);
  }
}

test();

const db = require('./config/db');

async function test() {
  try {
    const [result] = await db.execute(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [2, 'Test Title', 'Test Message', 'system']
    );
    console.log('Insert result:', result);
    process.exit(0);
  } catch (error) {
    console.error('Insert failed:', error);
    process.exit(1);
  }
}

test();

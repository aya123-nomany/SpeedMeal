const db = require('./config/db');

async function deleteTestData() {
  try {
    console.log('Deleting test data...');
    
    // Delete delivery drivers and restaurants from users table
    const [result] = await db.execute(
      "DELETE FROM users WHERE role IN ('delivery', 'restaurant')"
    );
    
    console.log(`Deleted ${result.affectedRows} test users (delivery drivers and restaurants)`);
    console.log('Test data deleted successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error deleting test data:', error.message);
    process.exit(1);
  }
}

deleteTestData();

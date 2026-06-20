
const mysql = require('mysql2/promise');

async function check() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'speedmeal'
    });

    try {
        console.log('Checking tables...');
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('Tables:', tables.map(t => Object.values(t)[0]));
        
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await connection.end();
    }
}

check();

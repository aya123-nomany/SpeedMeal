const net = require('net');

const client = net.connect({ port: 5000 }, () => {
  console.log('Port 5000 is open!');
  process.exit(0);
});

client.on('error', (err) => {
  console.log('Port 5000 is closed:', err.message);
  process.exit(1);
});

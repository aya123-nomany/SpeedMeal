const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function test() {
  const secret = process.env.JWT_SECRET || 'speedmeal_jwt_secret_2026';
  const token = jwt.sign({ id: 1, role: 'admin' }, secret, { expiresIn: '1h' });
  
  try {
    const response = await axios.post('http://localhost:5000/api/complaints/4/notify', {
      recipientType: 'client',
      title: 'Réponse à votre réclamation : problem',
      message: 'bonjour merci pour votre reclamation'
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Success response:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('Status code:', error.response.status);
      console.log('Error data:', error.response.data);
    } else {
      console.log('Request error:', error.message);
    }
  }
}

test();

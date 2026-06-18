const jwt = require('jsonwebtoken');

const JWT_SECRET = 'edutrack_secure_jwt_secret_2026_fallback';
const token = jwt.sign({ id: 'test-admin', role: 'admin', email: 'admin@edutrack.com' }, JWT_SECRET);

async function run() {
  const url = 'http://localhost:5173/neon-db/entities/Supervisor?limit=5';
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Status:', res.status);
    const json = await res.json();
    console.log('Supervisors:', json);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

run();

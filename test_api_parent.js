async function run() {
  const url = 'http://localhost:5173/neon-db/entities/Student?filters={"parent_id":"P-101"}';
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('API Status:', response.status);
    console.log('API Response:', data);
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

run().catch(console.error);

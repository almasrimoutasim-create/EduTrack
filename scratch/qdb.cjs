const { Client } = require('pg');
require('dotenv').config();
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await c.connect();
    const gw = await c.query('SELECT username, length(password) AS pwlen FROM gateway_accounts');
    const ad = await c.query("SELECT email, length(password) AS pwlen FROM system_admins");
    console.log('GATEWAY:', JSON.stringify(gw.rows));
    console.log('ADMIN:', JSON.stringify(ad.rows));
  } catch (e) {
    console.log('ERR', e.message);
  } finally { await c.end(); }
})();

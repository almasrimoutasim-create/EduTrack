import 'dotenv/config';
import { neon } from './server/db_compat.js';
const sql = neon(process.env.DATABASE_URL);
if (!sql) { console.error('No connection'); process.exit(1); }
try {
  const r = await sql`SELECT id, name, slug, subscription_status FROM schools WHERE slug IS NOT NULL AND subscription_status = 'active' ORDER BY id LIMIT 10`;
  console.log(JSON.stringify(r, null, 2));
} catch(e) {
  console.error(e.message);
}

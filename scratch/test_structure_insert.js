import { neon } from '../server/db_compat.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set!');
    return;
  }
  const sql = neon(url);
  try {
    console.log('--- INSERTING FEE STRUCTURE ---');
    const res = await sql`
      INSERT INTO fee_structures (grade_level, fee_name, amount, is_active, created_by)
      VALUES ('1', 'Test Fee Structure from Script', 1200, true, 'admin-id')
      RETURNING *;
    `;
    console.log('Insert Result:', res);
  } catch (err) {
    console.error('SQL Error details:', err);
  }
}
run();

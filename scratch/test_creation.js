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
    console.log('--- FEE STRUCTURES TABLE COLUMNS ---');
    const cols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'fee_structures';
    `;
    console.log(cols);

    console.log('--- TRYING TO INSERT A TEST RECORD ---');
    const res = await sql`
      INSERT INTO fee_structures (grade_level, fee_name, amount, payment_type, created_by, is_active)
      VALUES ('1', 'Test Fee', 5000, 'monthly', 'admin-id', true)
      RETURNING *;
    `;
    console.log('Insert Result:', res);
  } catch (err) {
    console.error('SQL Error details:', err);
  }
}
run();

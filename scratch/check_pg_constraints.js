import { neon } from '../server/db_compat.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const sql = neon(url);
  try {
    const constraints = await sql`
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conrelid = 'fee_structures'::regclass;
    `;
    console.log('PG Constraints:', constraints);
  } catch (err) {
    console.error(err);
  }
}
run();

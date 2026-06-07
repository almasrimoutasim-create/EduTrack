import { neon } from '../server/db_compat.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const sql = neon(url);
  try {
    console.log('Dropping constraint chk_grade_level on fee_structures...');
    await sql`ALTER TABLE fee_structures DROP CONSTRAINT IF EXISTS chk_grade_level;`;
    console.log('✓ Dropped chk_grade_level successfully!');
  } catch (err) {
    console.error('Failed to drop constraint:', err);
  }
}
run();

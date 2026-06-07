import { neon } from '../server/db_compat.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set');
    return;
  }
  const sql = neon(url);
  try {
    console.log('Altering column types to TEXT for user references...');
    
    await sql`ALTER TABLE fee_structures ALTER COLUMN created_by TYPE TEXT;`;
    console.log('✓ Altered fee_structures.created_by');

    await sql`ALTER TABLE student_fees ALTER COLUMN created_by TYPE TEXT;`;
    console.log('✓ Altered student_fees.created_by');

    await sql`ALTER TABLE activity_fees ALTER COLUMN created_by TYPE TEXT;`;
    console.log('✓ Altered activity_fees.created_by');

    await sql`ALTER TABLE fee_payments ALTER COLUMN paid_by TYPE TEXT;`;
    console.log('✓ Altered fee_payments.paid_by');

    console.log('All migrations completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}
run();

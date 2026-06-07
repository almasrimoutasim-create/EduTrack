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
    console.log('Altering fee_structures table...');
    // Make payment_type nullable and set default value to 'yearly'
    await sql`
      ALTER TABLE fee_structures 
      ALTER COLUMN payment_type DROP NOT NULL,
      ALTER COLUMN payment_type SET DEFAULT 'yearly';
    `;
    console.log('✓ Successfully made payment_type nullable and set default to "yearly".');

    // Test inserting a fee structure without payment_type
    console.log('Testing insert...');
    const res = await sql`
      INSERT INTO fee_structures (grade_level, fee_name, amount, is_active, created_by)
      VALUES ('2', 'Migration Test Fee', 1500, true, 'admin-id')
      RETURNING *;
    `;
    console.log('✓ Test insert succeeded:', res);
    
    // Clean up test record
    await sql`DELETE FROM fee_structures WHERE fee_name = 'Migration Test Fee'`;
    console.log('✓ Test record cleaned up.');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}
run();

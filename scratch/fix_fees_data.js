import { neon } from '../server/db_compat.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is missing.');
    return;
  }
  const sql = neon(url);
  try {
    console.log('Fixing student_fees NULL values in Neon Postgres...');
    const result = await sql`
      UPDATE student_fees 
      SET 
        amount_paid = COALESCE(amount_paid, 0),
        remaining = amount - COALESCE(amount_paid, 0),
        status = CASE 
          WHEN COALESCE(amount_paid, 0) >= amount THEN 'paid'
          WHEN COALESCE(amount_paid, 0) > 0 THEN 'partial'
          ELSE 'pending'
        END
      WHERE remaining IS NULL OR amount_paid IS NULL OR status IS NULL;
    `;
    console.log('✓ Successfully fixed student_fees records in DB.');
    
    // Log the updated values
    const updated = await sql`SELECT id, fee_name, amount, amount_paid, remaining, status FROM student_fees;`;
    console.log('Updated records:');
    console.log(JSON.stringify(updated, null, 2));
  } catch (err) {
    console.error('Failed to run update query:', err.message);
  }
}
run();

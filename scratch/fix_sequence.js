import { neon } from '../server/db_compat.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  const sql = neon(url);
  try {
    console.log('Altering fee_structures table to set unique_rowid() as default for id...');
    await sql`
      ALTER TABLE fee_structures ALTER COLUMN id SET DEFAULT unique_rowid();
    `;
    console.log('Successfully altered fee_structures!');

    // Let's test insert now!
    const res = await sql`
      INSERT INTO fee_structures (grade_level, fee_name, amount, payment_type, created_by, is_active)
      VALUES ('1', 'Test Fee after Alter', 6000, 'monthly', 1, true)
      RETURNING *;
    `;
    console.log('Insert success!', res);
  } catch (err) {
    console.error('Error during altering/inserting:', err.message);
  }
}
run();

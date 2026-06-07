import { neon } from '../server/db_compat.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const sql = neon(url);
  try {
    const fee_payments_cols = await sql`
      SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'fee_payments';
    `;
    const student_fees_cols = await sql`
      SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'student_fees';
    `;
    const activity_fees_cols = await sql`
      SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'activity_fees';
    `;
    console.log('fee_payments:', fee_payments_cols);
    console.log('student_fees:', student_fees_cols);
    console.log('activity_fees:', activity_fees_cols);
  } catch (err) {
    console.error(err);
  }
}
run();

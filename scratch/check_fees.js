import { neon } from '../server/db_compat.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const sql = neon(url);
  try {
    const studentFees = await sql`SELECT * FROM student_fees;`;
    const feePayments = await sql`SELECT * FROM fee_payments;`;
    console.log('--- student_fees ---');
    console.log(JSON.stringify(studentFees, null, 2));
    console.log('--- fee_payments ---');
    console.log(JSON.stringify(feePayments, null, 2));
  } catch (err) {
    console.error(err);
  }
}
run();

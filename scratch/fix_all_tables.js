import { neon } from '../server/db_compat.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  const sql = neon(url);
  const tables = [
    'student_fees',
    'fee_payments',
    'activity_fees',
    'student_activity_fees',
    'student_wallets',
    'wallet_transactions'
  ];

  for (const table of tables) {
    try {
      console.log(`Altering ${table} to set unique_rowid() as default for id...`);
      await sql.query(`
        ALTER TABLE ${table} ALTER COLUMN id SET DEFAULT unique_rowid();
      `);
      console.log(`Successfully altered ${table}!`);
    } catch (err) {
      console.log(`Could not alter ${table} (it might not exist, or might already have a serial default or different PK):`, err.message);
    }
  }
}
run();

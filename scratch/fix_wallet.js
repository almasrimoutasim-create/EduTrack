import { neon } from '../server/db_compat.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  const sql = neon(url);
  try {
    console.log('Altering student_wallet table id column to default to unique_rowid()...');
    await sql`
      ALTER TABLE student_wallet ALTER COLUMN id SET DEFAULT unique_rowid();
    `;
    console.log('Successfully altered student_wallet!');
  } catch (err) {
    console.error(err);
  }
}
run();

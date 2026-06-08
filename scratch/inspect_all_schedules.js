import { neon } from '../server/db_compat.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  const sql = neon(url);
  try {
    const existing = await sql`SELECT * FROM class_schedules;`;
    console.log('--- ALL CLASS SCHEDULES ---');
    console.log(existing);
  } catch (err) {
    console.error(err);
  }
}
run();

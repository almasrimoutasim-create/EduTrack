import { neon } from '../server/db_compat.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  const sql = neon(url);
  try {
    const cols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'class_schedules';
    `;
    console.log('--- class_schedules COLUMNS ---');
    console.log(cols);
    const existing = await sql`SELECT * FROM class_schedules LIMIT 2;`;
    console.log('--- existing records ---');
    console.log(existing);
  } catch (err) {
    console.error(err);
  }
}
run();

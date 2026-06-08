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
    console.log('--- CLASS_SCHEDULES COLUMNS ---');
    const cols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'class_schedules';
    `;
    console.log(cols);

    console.log('--- SUBJECTS COLUMNS ---');
    const scols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'subjects';
    `;
    console.log(scols);
  } catch (err) {
    console.error('Error:', err);
  }
}
run();

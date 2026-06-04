import { neon } from '@neondatabase/serverless';
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
    const cols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'class_schedules';
    `;
    console.log('--- CLASS_SCHEDULES COLUMNS ---');
    console.log(cols);

    const rows = await sql`SELECT * FROM class_schedules LIMIT 5;`;
    console.log('--- CLASS_SCHEDULES SAMPLE ROWS ---');
    console.log(rows);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
run();

import { neon } from '../server/db_compat.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  const sql = neon(url);
  try {
    const count = await sql`SELECT count(*) FROM class_schedules;`;
    console.log('--- TOTAL SCHEDULES COUNT ---');
    console.log(count);
    
    const sample = await sql`
      SELECT id, subject_name, teacher_name, grade, day_of_week, start_time, end_time 
      FROM class_schedules 
      ORDER BY created_at DESC 
      LIMIT 5;
    `;
    console.log('--- RECENT SAMPLE RECORDS ---');
    console.log(sample);
  } catch (err) {
    console.error(err);
  }
}
run();

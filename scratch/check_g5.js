import { neon } from '../server/db_compat.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  const sql = neon(url);
  try {
    const s = await sql`
      SELECT id, subject_name, teacher_name, teacher_id, grade, section, day_of_week, start_time, end_time, room 
      FROM class_schedules 
      WHERE grade = '5'
      ORDER BY day_of_week, start_time;
    `;
    console.log(s);
  } catch (err) {
    console.error(err);
  }
}
run();

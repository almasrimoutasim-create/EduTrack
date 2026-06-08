import { neon } from '../server/db_compat.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  const sql = neon(url);
  try {
    const grades = await sql`
      SELECT grade, day_of_week, count(*) 
      FROM class_schedules 
      GROUP BY grade, day_of_week
      ORDER BY grade, day_of_week;
    `;
    console.log(grades);
  } catch (err) {
    console.error(err);
  }
}
run();

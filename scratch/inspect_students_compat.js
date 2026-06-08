import { neon } from '../server/db_compat.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  const sql = neon(url);
  try {
    const students = await sql`SELECT id, student_id, full_name, status, grade, section FROM students;`;
    console.log('=== ALL STUDENTS ===');
    console.log(students);
  } catch (err) {
    console.error(err);
  }
}
run();

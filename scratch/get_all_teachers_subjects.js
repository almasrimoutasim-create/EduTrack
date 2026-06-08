import { neon } from '../server/db_compat.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  const sql = neon(url);
  try {
    const teachers = await sql`SELECT id, full_name, subject, subjects FROM teachers;`;
    const subjects = await sql`SELECT id, name, grade, teacher_id, teacher_name FROM subjects;`;
    console.log('=== ALL TEACHERS ===');
    console.log(teachers);
    console.log('=== ALL SUBJECTS ===');
    console.log(subjects);
  } catch (err) {
    console.error(err);
  }
}
run();

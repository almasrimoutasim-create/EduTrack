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
    console.log('--- ALL STUDENTS ---');
    const students = await sql`SELECT id, student_id, full_name, status, grade, section FROM students;`;
    console.log(students);
  } catch (err) {
    console.error('Error:', err);
  }
}
run();

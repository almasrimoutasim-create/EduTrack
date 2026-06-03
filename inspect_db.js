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
    console.log('--- TEACHERS COLUMNS ---');
    const teachersCols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'teachers';
    `;
    console.log(teachersCols);

    console.log('--- SUBJECTS COLUMNS ---');
    const subjectsCols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'subjects';
    `;
    console.log(subjectsCols);

    console.log('--- EXISTING SUBJECTS ---');
    const subjects = await sql`SELECT * FROM subjects LIMIT 5;`;
    console.log(subjects);

    console.log('--- EXISTING TEACHERS ---');
    const teachers = await sql`SELECT * FROM teachers LIMIT 5;`;
    console.log(teachers);

  } catch (err) {
    console.error('Error:', err);
  }
}
run();

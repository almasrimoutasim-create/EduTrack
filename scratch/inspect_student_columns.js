import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    return;
  }
  const sql = neon(url);
  try {
    const studentsCols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'students';
    `;
    console.log('--- Students Columns ---');
    console.log(studentsCols);

    const awardsCols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'student_awards';
    `;
    console.log('--- Student Awards Columns ---');
    console.log(awardsCols);

  } catch (err) {
    console.error(err);
  }
}
run();

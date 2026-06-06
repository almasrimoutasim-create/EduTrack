import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const sql = neon(url);
  try {
    const columns = await sql.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'student_awards'
      ORDER BY ordinal_position;
    `);
    console.log('--- STUDENT AWARDS COLUMNS ---');
    console.log(columns.map(c => `${c.column_name} (${c.data_type})`));
  } catch (err) {
    console.error('Error:', err.message);
  }
}
run();

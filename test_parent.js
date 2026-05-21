import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  
  // Let's see if querying SELECT * FROM students WHERE parent_id = '...' fails in postgres.
  try {
    console.log('Querying students with parent_id...');
    const result = await sql`SELECT * FROM students WHERE parent_id = 'P-101'`;
    console.log('Result:', result);
  } catch (err) {
    console.error('ERROR querying parent_id:', err.message);
  }

  // Let's check how students are associated with parents.
  console.log('\nQuerying active students and their parent emails...');
  const students = await sql`SELECT id, student_id, full_name, parent_email FROM students`;
  console.log(students);
}

run().catch(console.error);

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  const students = await sql`SELECT id, student_id, full_name, parent_email, card_balance FROM students LIMIT 5`;
  console.log(students);
}
run();

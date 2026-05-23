import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

async function checkIdType() {
  const url = process.env.DATABASE_URL;
  try {
    const sql = neon(url);
    const rows = await sql`
      SELECT id, student_id, full_name FROM students LIMIT 1
    `;
    if (rows.length > 0) {
      const row = rows[0];
      console.log('ID Field Type:', typeof row.id, 'Value:', row.id);
      console.log('STUDENT_ID Field Type:', typeof row.student_id, 'Value:', row.student_id);
    }
  } catch (err) {
    console.error(err);
  }
}
checkIdType();

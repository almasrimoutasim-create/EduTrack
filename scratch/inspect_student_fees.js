import { neon } from '../server/db_compat.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const sql = neon(url);
  try {
    const cols = await sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'student_fees';
    `;
    console.log('student_fees columns with defaults:');
    console.dir(cols, { depth: null });

    // Test inserting a student fee
    const students = await sql`SELECT id FROM students LIMIT 1`;
    if (students.length > 0) {
      console.log('Testing insert into student_fees...');
      const studentId = students[0].id;
      const res = await sql`
        INSERT INTO student_fees (student_id, fee_name, amount, due_date, created_by)
        VALUES (${studentId}, 'Migration Test Fee', 150, '2026-06-30', 'admin-id')
        RETURNING *;
      `;
      console.log('✓ Insert into student_fees succeeded:', res);
      // Clean up
      await sql`DELETE FROM student_fees WHERE fee_name = 'Migration Test Fee'`;
      console.log('✓ Cleaned up.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}
run();

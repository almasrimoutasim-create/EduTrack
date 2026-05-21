import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  
  console.log('Creating fines table...');
  await sql`
    CREATE TABLE IF NOT EXISTS fines (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id TEXT NOT NULL,
      amount NUMERIC NOT NULL DEFAULT 0,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      category TEXT,
      date TEXT,
      issued_by TEXT,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log('Fines table created successfully.');

  // Clean existing dummy fines first
  await sql`DELETE FROM fines WHERE reason LIKE 'E2E %' OR reason LIKE 'Mock %'`;

  // Fetch some students
  const students = await sql`SELECT id, full_name FROM students LIMIT 3`;
  if (students.length > 0) {
    console.log('Inserting mock fines for testing...');
    for (const student of students) {
      await sql`
        INSERT INTO fines (student_id, amount, reason, status, category, date, issued_by, notes)
        VALUES (
          ${student.id},
          25.50,
          'Mock Fine: Late library return for book "Introduction to Algorithms"',
          'pending',
          'library',
          '2026-05-18',
          'Librarian Sarah',
          'Book was overdue by 5 days'
        )
      `;
      await sql`
        INSERT INTO fines (student_id, amount, reason, status, category, date, issued_by, notes)
        VALUES (
          ${student.id},
          15.00,
          'Mock Fine: Damaged science lab equipment',
          'pending',
          'discipline',
          '2026-05-20',
          'Mr. Khalid',
          'Damaged beaker during chemistry class'
        )
      `;
      await sql`
        INSERT INTO fines (student_id, amount, reason, status, category, date, issued_by, notes)
        VALUES (
          ${student.id},
          50.00,
          'Mock Fine: Lost sports equipment (Basketball)',
          'paid',
          'sports',
          '2026-05-10',
          'Coach Ibrahim',
          'Paid on 2026-05-12'
        )
      `;
    }
    console.log('Mock fines inserted.');
  }
}
run().catch(console.error);

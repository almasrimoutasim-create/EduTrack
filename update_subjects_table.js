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
    console.log('Altering subjects table to add grade, teacher_id, teacher_name, and status columns...');
    
    // Add columns
    await sql`
      ALTER TABLE subjects 
      ADD COLUMN IF NOT EXISTS grade TEXT,
      ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS teacher_name TEXT,
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
    `;
    
    console.log('Columns added successfully!');
    
    // Check final columns
    const cols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'subjects';
    `;
    console.log('Final subjects table columns:', cols);
  } catch (err) {
    console.error('Error updating table:', err);
  }
}
run();

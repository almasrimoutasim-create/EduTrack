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
    console.log('Altering fines table to add updated_at column...');
    await sql`
      ALTER TABLE fines 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `;
    console.log('updated_at column added successfully!');
  } catch (err) {
    console.error('Error altering table:', err);
  }
}
run();

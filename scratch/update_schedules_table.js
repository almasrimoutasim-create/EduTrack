import { neon } from '../server/db_compat.js';
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
    console.log('Altering class_schedules table to add subject_id column...');
    await sql`
      ALTER TABLE class_schedules 
      ADD COLUMN IF NOT EXISTS subject_id UUID;
    `;
    console.log('Column subject_id added successfully!');
  } catch (err) {
    console.error('Error updating table:', err);
  }
}
run();

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
    console.log('--- TABLES IN SCHEMA ---');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;
    console.log(tables.map(t => t.table_name));

    console.log('--- PORTAL NOTIFICATIONS COLUMNS ---');
    const cols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'portal_notifications';
    `;
    console.log(cols);
  } catch (err) {
    console.error('Error:', err);
  }
}
run();

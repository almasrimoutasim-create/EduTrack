import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

async function listTables() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set!');
    return;
  }

  try {
    const sql = neon(url);
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('Tables in database:');
    console.log(tables.map(t => t.table_name));
  } catch (err) {
    console.error('Failed to list tables:', err);
  }
}

listTables();

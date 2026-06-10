import { neon } from '../server/db_compat.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  const sql = neon(url);
  try {
    console.log('--- TABLES & COLUMNS ---');
    const cols = await sql`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE column_name = 'section' OR column_name = 'class_section';
    `;
    console.log(cols);

    console.log('--- ALL TABLES ---');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;
    console.log(tables.map(t => t.table_name));

  } catch (err) {
    console.error('Error:', err);
  }
}
run();

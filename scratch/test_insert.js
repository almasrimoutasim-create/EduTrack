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
    const res = await sql.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'portal_notifications';");
    console.log('Columns of portal_notifications:', res);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
run();

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const sql = neon(url);
  try {
    const res = await sql`SELECT * FROM portal_notifications;`;
    console.log('portal_notifications rows:', res);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
run();

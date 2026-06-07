import { neon } from '../server/db_compat.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const sql = neon(url);
  try {
    const staff = await sql`
      SELECT id, full_name, role FROM staff_members;
    `;
    console.log('Staff Members:', staff);
  } catch (err) {
    console.error(err);
  }
}
run();

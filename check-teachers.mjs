import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env', 'utf-8').split('\n').filter(l => l.includes('=')).map(l => {
    const [k, ...v] = l.split('=');
    return [k.trim(), v.join('=').replace(/^"|"$/g, '')];
  })
);

const sql = neon(env.DATABASE_URL);
const rows = await sql`SELECT id, full_name, employee_id, status, school_id FROM teachers`;
console.log(JSON.stringify(rows, null, 2));

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
const env = Object.fromEntries(
  readFileSync('.env', 'utf-8').split('\n').filter(l => l.includes('=')).map(l => {
    const [k, ...v] = l.split('='); return [k.trim(), v.join('=').replace(/^"|"$/g, '')];
  })
);
const sql = neon(env.DATABASE_URL);
const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='teachers' ORDER BY ordinal_position`;
console.log('teachers cols:', cols.map(c => c.column_name).join(', '));
const rows = await sql`SELECT email, username, portal_password_plain FROM teachers WHERE school_id = 'd8077b44-9b52-4344-8387-9c76c4804a28' AND portal_password_plain IS NOT NULL LIMIT 4`;
console.log(JSON.stringify(rows, null, 1));

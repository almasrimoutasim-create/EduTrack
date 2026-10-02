import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env', 'utf-8').split('\n').filter(l => l.includes('=')).map(l => {
    const [k, ...v] = l.split('=');
    return [k.trim(), v.join('=').replace(/^"|"$/g, '')];
  })
);

const sql = neon(env.DATABASE_URL);

const cols0 = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='staff_members' ORDER BY ordinal_position`;
const names = cols0.map(c => c.column_name);
console.log('staff_members columns:', names.join(', '));

const pwCol = names.find(n => /pass|pwd/i.test(n)) || 'password_hash';
const rows = await sql.query(`SELECT id, full_name, email, employee_id, role, status, school_id, (${pwCol} IS NOT NULL) AS has_pw FROM staff_members ORDER BY role`, []);
console.log('staff_members rows:', rows.length);
console.log(JSON.stringify(rows, null, 2));

const roles = await sql`SELECT role, count(*)::int AS n FROM staff_members GROUP BY role ORDER BY n DESC`;
console.log('by role:', JSON.stringify(roles));

const gw = await sql`SELECT username, role, school_id FROM gateway_accounts ORDER BY username`;
console.log('gateway_accounts:', JSON.stringify(gw));

const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='staff_members' ORDER BY ordinal_position`;
console.log('staff_members columns:', cols.map(c => c.column_name).join(', '));
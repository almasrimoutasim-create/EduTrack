import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env', 'utf-8').split('\n').filter(l => l.includes('=')).map(l => {
    const [k, ...v] = l.split('='); return [k.trim(), v.join('=').replace(/^"|"$/g, '')];
  })
);
const sql = neon(env.DATABASE_URL);
const SECRET = env.JWT_SECRET;
const BASE = 'http://localhost:3000';

const admin = await sql`SELECT id, school_id FROM system_admins LIMIT 1`;
const token = jwt.sign({ id: admin[0].id, role: 'admin', school_id: admin[0].school_id }, SECRET, { expiresIn: '1h' });
const get = async (p) => (await fetch(`${BASE}${p}`, { headers: { Authorization: `Bearer ${token}` } })).json();

const t = (await sql`SELECT id, full_name FROM teachers LIMIT 1`)[0];
const TEST = 'https://example.com/test-photo.png';
await sql`UPDATE teachers SET photo_url = ${TEST} WHERE id = ${t.id}`;

// Direct DB read-back
const dbRow = await sql`SELECT id, photo_url FROM teachers WHERE id = ${t.id}`;
console.log('DB read-back photo_url =', JSON.stringify(dbRow[0].photo_url));

// API list read-back
const teachers = await get('/neon-db/entities/Teacher');
const apiRow = teachers.find(x => x.id === t.id);
console.log('API list row keys =', Object.keys(apiRow || {}).join(','));
console.log('API list photo_url =', JSON.stringify(apiRow?.photo_url));
console.log('API list has photo_url key =', apiRow ? ('photo_url' in apiRow) : 'row not found');

await sql`UPDATE teachers SET photo_url = NULL WHERE id = ${t.id}`;
console.log('cleaned up');

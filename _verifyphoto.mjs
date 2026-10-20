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

// Real teacher + student (first from each table)
const t = (await sql`SELECT id, full_name FROM teachers LIMIT 1`)[0];
const s = (await sql`SELECT id, full_name FROM students LIMIT 1`)[0];
console.log('real teacher:', t.id, t.full_name);
console.log('real student:', s.id, s.full_name);

const TEST = 'https://example.com/test-photo.png';
await sql`UPDATE teachers SET photo_url = ${TEST} WHERE id = ${t.id}`;
await sql`UPDATE students SET photo_url = ${TEST} WHERE id = ${s.id}`;

// Fetch via API and run the exact photoMap logic from the frontend
const teachers = await get('/neon-db/entities/Teacher');
const students = await get('/neon-db/entities/Student');
const photoMap = {};
for (const u of [...students, ...teachers]) {
  if (!u?.id) continue;
  const url = u.photo_url || u.avatar_url || u.profile_image || null;
  if (url) photoMap[String(u.id)] = url;
}
console.log('--- frontend photoMap resolution ---');
console.log('teacher', t.id, '->', photoMap[String(t.id)] || 'MISSING');
console.log('student', s.id, '->', photoMap[String(s.id)] || 'MISSING');

// Cleanup
await sql`UPDATE teachers SET photo_url = NULL WHERE id = ${t.id}`;
await sql`UPDATE students SET photo_url = NULL WHERE id = ${s.id}`;
console.log('cleaned up');

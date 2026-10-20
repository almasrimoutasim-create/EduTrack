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

async function get(path) {
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
      const txt = await res.text();
      return { status: res.status, body: txt };
    } catch { await new Promise(r => setTimeout(r, 800)); }
  }
  return { status: 0, body: 'SERVER_DOWN' };
}

for (const p of [
  '/neon-db/entities/VirtualSession',
  '/neon-db/entities/TeacherSubject',
  '/neon-db/entities/ClassSchedule',
  '/neon-db/entities/Student',
  '/api/ice-config',
]) {
  const r = await get(p);
  let info = '';
  try {
    const j = JSON.parse(r.body);
    info = Array.isArray(j) ? `array len=${j.length}` : Object.keys(j).slice(0, 6).join(',');
  } catch { info = r.body.slice(0, 200); }
  console.log(`${r.status}  ${p}  -> ${info}`);
}

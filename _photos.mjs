import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
const env = Object.fromEntries(
  readFileSync('.env', 'utf-8').split('\n').filter(l => l.includes('=')).map(l => {
    const [k, ...v] = l.split('='); return [k.trim(), v.join('=').replace(/^"|"$/g, '')];
  })
);
const sql = neon(env.DATABASE_URL);
const st = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='students' ORDER BY ordinal_position`;
console.log('students cols:', st.map(c => c.column_name).join(', '));
const sp = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='session_participants' ORDER BY ordinal_position`;
console.log('session_participants cols:', sp.map(c => c.column_name).join(', '));
// sample student photos
const s = await sql`SELECT id, full_name, photo_url, avatar_url, grade FROM students WHERE school_id='d8077b44-9b52-4344-8387-9c76c4804a28' LIMIT 3`;
console.log('students sample:', JSON.stringify(s, null, 1));
// teacher photos
const t = await sql`SELECT id, full_name, photo_url, avatar_url FROM teachers WHERE school_id='d8077b44-9b52-4344-8387-9c76c4804a28' AND (photo_url IS NOT NULL OR avatar_url IS NOT NULL) LIMIT 3`;
console.log('teachers with photos:', JSON.stringify(t, null, 1));
// any participants rows with photos?
const p = await sql`SELECT user_id, user_name, role FROM session_participants LIMIT 5`;
console.log('participants sample:', JSON.stringify(p, null, 1));

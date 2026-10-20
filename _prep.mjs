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

// A real teacher who is a participant (مع不可思议 on فتاش)
const teacher = (await sql`SELECT id, full_name, school_id FROM teachers WHERE id = '6a0be496-c77a-415b-81c4-24e17b69f0a9'`)[0]
  || (await sql`SELECT id, full_name, school_id FROM teachers LIMIT 1`)[0];
console.log('teacher:', teacher.id, teacher.full_name, teacher.school_id);

// A distinct test photo (teal avatar) so it's visually obvious
const TEST = 'https://api.dicebear.com/9.x/initials/png?seed=Teacher&backgroundColor=0d9488';
await sql`UPDATE teachers SET photo_url = ${TEST} WHERE id = ${teacher.id}`;

// An active session this teacher participated in
const sess = (await sql`SELECT DISTINCT session_id FROM session_participants WHERE user_id = ${teacher.id} LIMIT 1`)[0];
console.log('session:', sess?.session_id || 'none');

// Login-shaped JWT (role teacher)
const token = jwt.sign({ id: teacher.id, role: 'teacher', school_id: teacher.school_id }, SECRET, { expiresIn: '2h' });

// Output a JSON the browser-injection step can consume
const payload = {
  teacherId: teacher.id,
  teacherName: teacher.full_name,
  schoolId: teacher.school_id,
  photo: TEST,
  sessionId: sess?.session_id || null,
  token,
};
readFileSync; // noop
console.log('PAYLOAD_JSON:' + JSON.stringify(payload));

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
const env = Object.fromEntries(
  readFileSync('.env', 'utf-8').split('\n').filter(l => l.includes('=')).map(l => {
    const [k, ...v] = l.split('='); return [k.trim(), v.join('=').replace(/^"|"$/g, '')];
  })
);
const sql = neon(env.DATABASE_URL);
// Reset the test photo I set during verification
const r = await sql`UPDATE teachers SET photo_url = NULL WHERE id = '6a0be496-c77a-415b-81c4-24e17b69f0a9' RETURNING id, photo_url`;
console.log('reset teacher photo:', JSON.stringify(r));

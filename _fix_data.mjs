import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
const env = Object.fromEntries(
  readFileSync('.env', 'utf-8').split('\n').filter(l => l.includes('=')).map(l => {
    const [k, ...v] = l.split('=');
    return [k.trim(), v.join('=').replace(/^"|"$/g, '')];
  })
);
const sql = neon(env.DATABASE_URL);
for (const col of ['school_logo','school_background_image','sidebar_logo']) {
  // Strip trailing ?t=... from data URIs
  await sql.query(`UPDATE system_settings SET ${col} = regexp_replace(${col}, '\\?t=[0-9]+$', '') WHERE ${col} LIKE 'data:%?t=%'`, []);
}
// verify
for (const col of ['school_logo','school_background_image','sidebar_logo']) {
  const r = await sql.query(`SELECT (position('?t=' in ${col}) > 0) AS has_qt, length(${col}) AS len FROM system_settings`, []);
  console.log(col, r[0]);
}
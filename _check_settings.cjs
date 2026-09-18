require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
(async () => {
  const rows = await sql`SELECT id, school_id, school_name_ar, sidebar_short_name, LEFT(school_logo,60) as logo_prefix, LEFT(sidebar_logo,60) as sb_logo FROM system_settings ORDER BY created_at DESC`;
  console.log('Total records:', rows.length);
  rows.forEach((r, i) => {
    console.log(`#${i+1}`, 'school_id:', r.school_id, '| name:', r.school_name_ar, '| sidebar_name:', r.sidebar_short_name, '| logo:', (r.logo_prefix||'').substring(0,40), '| sb_logo:', (r.sb_logo||'').substring(0,40));
  });
  // Also check schools table
  const schools = await sql`SELECT id, name FROM schools ORDER BY created_at DESC`;
  console.log('\nSchools:', schools.length);
  schools.forEach((s, i) => console.log(`#${i+1}`, s.id, s.name));
})().catch(e => console.error(e.message));

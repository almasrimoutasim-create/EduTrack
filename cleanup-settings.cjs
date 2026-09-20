require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
(async () => {
  const deleted = await sql`DELETE FROM system_settings WHERE school_id IN ('3f5b49ae','dc71338e','069adec0','390f8c3d','c160fabc') RETURNING school_id, school_name_ar`;
  console.log('Deleted rows:', deleted.length);
  deleted.forEach((r, i) => console.log(`#${i+1}`, 'school_id:', r.school_id, '| name:', r.school_name_ar));

  const remaining = await sql`SELECT id, school_id, school_name_ar, sidebar_short_name FROM system_settings ORDER BY created_at DESC`;
  console.log('\nRemaining system_settings:', remaining.length);
  remaining.forEach((r, i) => console.log(`#${i+1}`, 'school_id:', r.school_id, '| name:', r.school_name_ar, '| sidebar_name:', r.sidebar_short_name));
})().catch(e => console.error(e.message));
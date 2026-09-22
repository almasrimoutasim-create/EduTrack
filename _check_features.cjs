require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
(async () => {
  try {
    const ff = await sql`SELECT COUNT(*) as c FROM feature_flags`;
    console.log('feature_flags count:', ff[0].c);
    const tf = await sql`SELECT COUNT(*) as c FROM tier_features`;
    console.log('tier_features count:', tf[0].c);
    const f = await sql`SELECT feature_key, category, name_ar FROM feature_flags ORDER BY category LIMIT 5`;
    console.log('sample flags:', f);
    const t = await sql`SELECT tier, COUNT(*) as c FROM tier_features GROUP BY tier`;
    console.log('tier counts:', t);
  } catch(e){ console.error('ERR', e.message, e); }
})();

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const columns = await sql.query(
  `SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'system_settings'
   ORDER BY ordinal_position`
);
console.log("=== system_settings columns ===");
for (const c of columns) console.log(c);

const orphans = await sql.query(
  `SELECT ss.id, ss.school_id, ss.school_name_ar, ss.sidebar_short_name
   FROM system_settings ss
   LEFT JOIN schools s ON s.id = ss.school_id::text
   WHERE s.id IS NULL
   ORDER BY ss.created_at DESC`
);
console.log("\n=== orphaned system_settings rows (no matching school) ===");
for (const o of orphans) console.log(o);

const all = await sql.query(
  `SELECT id, school_id, school_name_ar, sidebar_short_name, created_at
   FROM system_settings
   ORDER BY created_at DESC`
);
console.log("\n=== ALL system_settings rows ===");
for (const a of all) console.log(a);

const schoolCount = await sql.query(`SELECT count(*)::int AS n FROM schools`);
console.log("\n=== schools count ===", schoolCount);
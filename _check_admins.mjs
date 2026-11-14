import { neon } from '@neondatabase/serverless';
const DB = 'postgresql://neondb_owner:npg_2BcoIaUX1lVQ@ep-little-dawn-ap8mvsvt-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(DB);
const sid = 'bb987833-1ef7-4656-8ab2-d81cad2e26e5';
const r = await sql`SELECT id, email, username, portal_username, full_name, role FROM system_admins WHERE school_id = ${sid} LIMIT 10`;
console.log(JSON.stringify(r, null, 2));
process.exit(0);
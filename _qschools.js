import { neon } from '@neondatabase/serverless';
const sql = neon('postgresql://neondb_owner:npg_2BcoIaUX1lVQ@ep-little-dawn-ap8mvsvt-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');
const c = await sql`SELECT count(*) AS c FROM schools`;
console.log('SCHOOLS COUNT:', JSON.stringify(c));
const r = await sql`SELECT id,name,name_ar,slug,subscription_status,created_at FROM schools ORDER BY created_at DESC LIMIT 20`;
console.log('SCHOOLS:', JSON.stringify(r, null, 2));
process.exit(0);

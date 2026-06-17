require('dotenv').config({ path: '.env' });
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);

async function checkRecords() {
  const records = await sql`SELECT * FROM salary_records`;
  console.log('Records count:', records.length);
  console.log(records);
  process.exit(0);
}
checkRecords();

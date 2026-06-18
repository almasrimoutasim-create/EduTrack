const pg = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const sups = await pool.query("SELECT * FROM supervisors;");
    console.log('Supervisors in DB:', sups.rows);
    
    const staff = await pool.query("SELECT * FROM staff_members WHERE role = 'bus_supervisor' OR role LIKE '%bus%' OR role LIKE '%supervisor%';");
    console.log('Staff with bus/supervisor role in DB:', staff.rows);
    
    const allRoles = await pool.query("SELECT DISTINCT role FROM staff_members;");
    console.log('Distinct staff roles:', allRoles.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();

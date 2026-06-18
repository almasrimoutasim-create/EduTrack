require('dotenv').config({ path: '.env' });
const pg = require('pg');

async function run() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const colsRes = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'students'
    `);
    console.log('--- STUDENTS COLUMNS ---');
    console.log(colsRes.rows.map(r => `${r.column_name} (${r.data_type})`));
    
    const studentsRes = await pool.query('SELECT * FROM students LIMIT 1');
    console.log('--- ONE STUDENT RECORD KEYS ---');
    if (studentsRes.rows.length > 0) {
      console.log(Object.keys(studentsRes.rows[0]));
    } else {
      console.log('No students found');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();

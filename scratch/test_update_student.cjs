require('dotenv').config({ path: '.env' });
const pg = require('pg');

async function run() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const studentsRes = await pool.query('SELECT * FROM students LIMIT 1');
    if (studentsRes.rows.length === 0) {
      console.log('No students found to test');
      return;
    }
    const student = studentsRes.rows[0];
    console.log('Testing update for student:', student.id, student.full_name);

    // Replicate payload processing from api.js
    const body = { ...student };
    
    // In StudentForm.jsx, portal_password and parent_password are set to "" in useEffect,
    // and then in handleSave they are deleted if falsy.
    // If not falsy/not empty, they get hashed. Let's keep them as-is or remove them.
    delete body.portal_password;
    delete body.parent_password;

    // Convert date to string or keep as Date object (pg returns date type as Date object, 
    // but in API request it's a string "YYYY-MM-DD" or similar)
    if (body.date_of_birth) {
      body.date_of_birth = body.date_of_birth.toISOString().substring(0, 10);
    }

    const keys = Object.keys(body).filter(k =>
      k !== 'id' && k !== 'created_at' && k !== 'updated_at' && body[k] !== undefined
    );
    
    const sets = keys.map((k, i) => `${k} = $${i + 1}`);
    const values = keys.map(k => body[k]);
    values.push(student.id);
    
    const q = `UPDATE students SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`;
    console.log('Query:', q);
    console.log('Values:', values);
    
    const updateRes = await pool.query(q, values);
    console.log('Update Success!', updateRes.rows[0]);
  } catch (err) {
    console.error('Update Failed with Error:', err);
  } finally {
    await pool.end();
  }
}
run();

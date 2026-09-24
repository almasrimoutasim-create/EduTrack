import dotenv from 'dotenv';
dotenv.config();
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
const sql = neon(process.env.DATABASE_URL);
try {
  const em = 'almasrimoutasim@gmail.com';
  const pw = 'Etrack@430655';
  
  // Test 1: Without schoolId (school_id IS NULL query)
  const rowsNoSchool = await sql.query(`SELECT * FROM system_admins WHERE LOWER(email) = LOWER($1) AND school_id IS NULL`, [em]);
  console.log('Test 1 - Without schoolId (school_id IS NULL):', rowsNoSchool.length > 0 ? 'FOUND' : 'NOT FOUND');
  
  // Test 2: With schoolId
  const schoolId = 'd8077b44-9b52-4344-8387-9c76c4804a28';
  const rowsWithSchool = await sql.query(`SELECT * FROM system_admins WHERE LOWER(email) = LOWER($1) AND school_id = $2`, [em, schoolId]);
  console.log('Test 2 - With schoolId:', rowsWithSchool.length > 0 ? 'FOUND' : 'NOT FOUND');
  if (rowsWithSchool.length > 0) {
    console.log('  Password hash starts with:', rowsWithSchool[0].password?.substring(0, 7));
    console.log('  portal_password set:', !!rowsWithSchool[0].portal_password);
  }
  
  // Test 3: Password verification
  if (rowsWithSchool.length > 0) {
    const adminRow = rowsWithSchool[0];
    const match1 = adminRow.password ? bcrypt.compareSync(pw, adminRow.password) : false;
    const match2 = adminRow.portal_password ? bcrypt.compareSync(pw, adminRow.portal_password) : false;
    console.log('\nPassword "Etrack@430655" matches:', match1 || match2);
  }
  
  // Test 4: Default admin
  const rowsDefault = await sql.query(`SELECT * FROM system_admins WHERE email = 'admin@edutrack.com'`);
  if (rowsDefault.length > 0) {
    const dr = rowsDefault[0];
    const pwd1 = dr.password ? bcrypt.compareSync('admin123', dr.password) : false;
    console.log('Default admin with "admin123":', pwd1 ? 'MATCHES' : 'NO MATCH');
  }
  
  // Test 5: Check ALL system_admins (no filter)
  const allAdmins = await sql.query(`SELECT id, email, role, status, school_id FROM system_admins`);
  console.log('\nAll admins count:', allAdmins.length);
  allAdmins.forEach(a => console.log('  ', a.email, '| role:', a.role, '| status:', a.status, '| school_id:', a.school_id));
} catch(e) {
  console.error('Error:', e.message);
}

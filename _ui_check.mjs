import dotenv from 'dotenv';
dotenv.config();
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
const sql = neon(process.env.DATABASE_URL);
try {
  const em = 'almasrimoutasim@gmail.com';
  const schoolId = 'd8077b44-9b52-4344-8387-9c76c4804a28';
  
  // Simulate check-account-type endpoint logic (with schoolId)
  console.log('=== check-account-type WITH schoolId ===');
  let gwRows = await sql.query(`SELECT id, username FROM gateway_accounts WHERE username = $1 AND school_id = $2`, [em, schoolId]);
  if (gwRows.length === 0) {
    gwRows = await sql.query(`SELECT id, username FROM gateway_accounts WHERE username = $1 AND school_id IS NULL`, [em]);
  }
  console.log('Gateway check:', gwRows.length > 0 ? `FOUND (${gwRows[0].username})` : 'none');
  
  let admRows = await sql.query(`SELECT id, email, role FROM system_admins WHERE school_id = $1 AND role = 'admin' AND (LOWER(email) = LOWER($2) OR LOWER(portal_username) = LOWER($2))`, [schoolId, em]);
  console.log('Admin check (with schoolId):', admRows.length > 0 ? `FOUND role=${admRows[0].role}` : 'none');
  
  // Simulate check-account-type WITHOUT schoolId
  console.log('\n=== check-account-type WITHOUT schoolId ===');
  let gwRows2 = await sql.query(`SELECT id, username FROM gateway_accounts WHERE username = $1 AND school_id IS NULL`, [em]);
  console.log('Gateway check:', gwRows2.length > 0 ? 'FOUND' : 'none');
  
  let admRows2 = await sql.query(`SELECT id, email, role FROM system_admins WHERE role = 'admin' AND (LOWER(email) = LOWER($2) OR LOWER(portal_username) = LOWER($2))`, [em]);
  console.log('Admin check (no schoolId):', admRows2.length > 0 ? `FOUND role=${admRows2[0].role}` : 'none');
  
  // Test password matching
  console.log('\n=== PASSWORD VERIFICATION ===');
  const adminData = await sql.query(`SELECT password, portal_password FROM system_admins WHERE email = $1`, [em]);
  if (adminData.length > 0) {
    const ar = adminData[0];
    const pw = 'Etrack@430655';
    const m1 = ar.password ? bcrypt.compareSync(pw, ar.password) : false;
    const m2 = ar.portal_password ? bcrypt.compareSync(pw, ar.portal_password) : false;
    console.log(`"Etrack@430655" matches password: ${m1}`);
    console.log(`"Etrack@430655" matches portal_password: ${m2}`);
    console.log(`Password hash prefix: ${ar.password?.substring(0, 7)}`);
    console.log(`portal_password hash prefix: ${ar.portal_password?.substring(0, 7)}`);
  }
  
  // Try to find what password works
  console.log('\n=== TESTING COMMON PASSWORDS ===');
  const testPasswords = ['admin123', 'edutrack2026', 'Etrack@430655', 'almasrimoutasim', 'password', '123456'];
  for (const testPw of testPasswords) {
    const m1 = adminData[0].password ? bcrypt.compareSync(testPw, adminData[0].password) : false;
    const m2 = adminData[0].portal_password ? bcrypt.compareSync(testPw, adminData[0].portal_password) : false;
    if (m1 || m2) {
      console.log(`✅ "${testPw}" MATCHES!`);
    }
  }
  console.log('None of the common passwords matched.');
  
} catch(e) {
  console.error('Error:', e.message);
}

import { neon } from './server/db_compat.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

function hashPassword(password) {
  if (!password) return '';
  return bcrypt.hashSync(password, 10);
}

async function runVerification() {
  console.log("====================================================");
  console.log("🔒 EduTrack E2E Security Verification & Assertion 🔒");
  console.log("====================================================\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ Error: DATABASE_URL is not set in environment.");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // 1. Column Presence Verification
    console.log("🔍 [1/4] Checking database schema columns...");
    
    // Check students
    const studentCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'students'`;
    const studentColNames = studentCols.map(c => c.column_name);
    console.log("   - students table columns:", studentColNames.filter(name => name.includes('password') || name.includes('email')));
    
    if (!studentColNames.includes('portal_password') || !studentColNames.includes('parent_password')) {
      throw new Error("Missing portal_password or parent_password in students table");
    }

    // Check teachers
    const teacherCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'teachers'`;
    const teacherColNames = teacherCols.map(c => c.column_name);
    console.log("   - teachers table columns:", teacherColNames.filter(name => name.includes('password') || name.includes('email')));
    
    if (!teacherColNames.includes('portal_password')) {
      throw new Error("Missing portal_password in teachers table");
    }

    // Check supervisors
    const supervisorCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'supervisors'`;
    const supervisorColNames = supervisorCols.map(c => c.column_name);
    console.log("   - supervisors table columns:", supervisorColNames.filter(name => name.includes('password') || name.includes('email')));
    
    if (!supervisorColNames.includes('portal_password')) {
      throw new Error("Missing portal_password in supervisors table");
    }

    console.log("✅ Schema Verification Passed! All password columns are present and ready.\n");

    // 2. Encryption Roundtrip Testing
    console.log("🧪 [2/4] Testing cryptographic hashing and persistence...");
    
    const plainStudentPass = "student_secure_2026";
    const plainParentPass = "parent_secure_2026";
    const plainTeacherPass = "teacher_secure_2026";

    const hashedStudentPass = hashPassword(plainStudentPass);
    const hashedParentPass = hashPassword(plainParentPass);
    const hashedTeacherPass = hashPassword(plainTeacherPass);

    console.log("   - Plain Student Pass:", plainStudentPass, "-> Hashed (SHA-256):", hashedStudentPass);
    console.log("   - Plain Parent Pass: ", plainParentPass, "-> Hashed (SHA-256):", hashedParentPass);

    // Insert clean test users
    console.log("   - Creating temporary test Student with secure hashed passwords...");
    const [testStudent] = await sql.query(`
      INSERT INTO students (
        full_name, student_id, user_email, portal_password, 
        parent_name, parent_email, parent_password, grade, status
      ) VALUES (
        'Test Student E2E', 'STU-TEST-999', 'test-student@edutrack.com', $1,
        'Test Parent E2E', 'test-parent@edutrack.com', $2, '12', 'active'
      ) RETURNING *
    `, [hashedStudentPass, hashedParentPass]);

    console.log("   - Creating temporary test Teacher with secure hashed password...");
    const [testTeacher] = await sql.query(`
      INSERT INTO teachers (
        full_name, employee_id, email, portal_password, status
      ) VALUES (
        'Test Teacher E2E', 'TCH-TEST-999', 'test-teacher@edutrack.com', $1, 'active'
      ) RETURNING *
    `, [hashedTeacherPass]);

    console.log("✅ Encryption roundtrip records persisted cleanly!\n");

    // 3. Simulating Login Requests (matching backend code exactly)
    console.log("🔐 [3/4] Simulating auth validation...");

    // Case A: Student Login Success
    const studentQuery = await sql.query(
      "SELECT * FROM students WHERE (user_email = $1 OR student_id = $1) AND status = 'active'",
      ['test-student@edutrack.com']
    );
    if (studentQuery.length === 0) throw new Error("E2E Student query failed to retrieve row");
    const retrievedStudent = studentQuery[0];
    
    if (bcrypt.compareSync(plainStudentPass, retrievedStudent.portal_password)) {
      console.log("   ✅ E2E Student Login: SUCCESS (Hashed match)");
    } else {
      throw new Error("E2E Student Login: FAILED (Hashed password mismatch)");
    }

    // Case B: Parent Login Success
    const parentQuery = await sql.query(
      "SELECT * FROM students WHERE parent_email = $1 AND status = 'active'",
      ['test-parent@edutrack.com']
    );
    if (parentQuery.length === 0) throw new Error("E2E Parent query failed to retrieve row");
    const retrievedParent = parentQuery[0];
    
    if (bcrypt.compareSync(plainParentPass, retrievedParent.parent_password)) {
      console.log("   ✅ E2E Parent Login: SUCCESS (Hashed match)");
    } else {
      throw new Error("E2E Parent Login: FAILED (Hashed password mismatch)");
    }

    // Case C: Teacher Login Success
    const teacherQuery = await sql.query(
      "SELECT * FROM teachers WHERE (email = $1 OR employee_id = $1) AND status = 'active'",
      ['test-teacher@edutrack.com']
    );
    if (teacherQuery.length === 0) throw new Error("E2E Teacher query failed to retrieve row");
    const retrievedTeacher = teacherQuery[0];

    if (bcrypt.compareSync(plainTeacherPass, retrievedTeacher.portal_password)) {
      console.log("   ✅ E2E Teacher Login: SUCCESS (Hashed match)");
    } else {
      throw new Error("E2E Teacher Login: FAILED (Hashed password mismatch)");
    }

    // Case D: Invalid Password Rejection
    if (!bcrypt.compareSync("wrong_password", retrievedStudent.portal_password)) {
      console.log("   ✅ E2E Auth Rejection: SUCCESS (Invalid password safely blocked)");
    } else {
      throw new Error("E2E Auth Rejection: FAILED (Allowed incorrect password!)");
    }

    // 4. Database Cleanup
    console.log("\n🧹 [4/4] Cleaning up E2E temporary test entries...");
    await sql`DELETE FROM students WHERE student_id = 'STU-TEST-999'`;
    await sql`DELETE FROM teachers WHERE employee_id = 'TCH-TEST-999'`;
    console.log("✅ Cleanup complete. Database is pristine.\n");

    console.log("====================================================");
    console.log("🎉 SUCCESS: ALL SECURITY CHECKS & LOGINS VALIDATED! 🎉");
    console.log("====================================================");

  } catch (error) {
    console.error("\n❌ E2E Security Assertion FAILED:");
    console.error(error.message);
    process.exit(1);
  }
}

runVerification();

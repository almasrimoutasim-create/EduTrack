import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    const teacherEmail = 'musab@gmail.com';
    const teachers = await sql`SELECT id, employee_id, full_name, email FROM teachers WHERE email = ${teacherEmail}`;
    console.log('--- TEACHER ---');
    console.log(JSON.stringify(teachers, null, 2));

    if (teachers.length > 0) {
      const tId = teachers[0].id;
      const schedules = await sql`SELECT * FROM class_schedules WHERE teacher_id = ${tId} OR teacher_name LIKE '%مصعب%'`;
      console.log('--- TEACHER SCHEDULES ---');
      console.log(JSON.stringify(schedules, null, 2));

      const subjects = await sql`SELECT * FROM subjects WHERE teacher_id = ${tId}`;
      console.log('--- TEACHER SUBJECTS ---');
      console.log(JSON.stringify(subjects, null, 2));
    }

    const allSchedules = await sql`SELECT id, teacher_name, subject_name, grade, section FROM class_schedules`;
    console.log('--- ALL SCHEDULES ---');
    console.log(JSON.stringify(allSchedules, null, 2));

    const allStudents = await sql`SELECT id, student_id, full_name, grade, section FROM students`;
    console.log('--- ALL STUDENTS ---');
    console.log(JSON.stringify(allStudents, null, 2));

  } catch (err) {
    console.error(err);
  }
}
run();

import { neon } from '@neondatabase/serverless';
const sql = neon('postgresql://neondb_owner:npg_lvhWgpGZ38XP@ep-little-dawn-ap8mvsvt-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require');

const teachers = await sql`SELECT id, full_name, email, employee_id, portal_password_plain, status, school_id FROM teachers LIMIT 10`;
console.log('TEACHERS:', JSON.stringify(teachers, null, 2));

const students = await sql`SELECT id, full_name, user_email, student_id, portal_password_plain, status, school_id FROM students LIMIT 10`;
console.log('STUDENTS:', JSON.stringify(students, null, 2));

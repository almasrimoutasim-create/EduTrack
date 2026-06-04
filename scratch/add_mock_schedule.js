import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const todayDay = DAYS_EN[new Date().getDay()];

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set!');
    return;
  }
  const sql = neon(url);
  try {
    console.log('Inserting mock schedules...');
    
    // Clear existing for testing
    await sql`DELETE FROM class_schedules;`;

    // 1. Math class for grade 1 today
    await sql`
      INSERT INTO class_schedules (grade, section, day_of_week, start_time, end_time, room, subject_name, teacher_id, teacher_name)
      VALUES (
        '1', 
        'عمر', 
        ${todayDay}, 
        '08:00', 
        '09:30', 
        '101', 
        'الرياضيات', 
        '8afac8cb-85cf-4eb2-b41a-7c96ebf9ad12', 
        'معتصم علي فتاش'
      );
    `;

    // 2. Arabic class for grade 1 today
    await sql`
      INSERT INTO class_schedules (grade, section, day_of_week, start_time, end_time, room, subject_name, teacher_id, teacher_name)
      VALUES (
        '1', 
        'عمر', 
        ${todayDay}, 
        '10:00', 
        '11:30', 
        '102', 
        'اللغة العربية', 
        'ee132f64-29f1-4bff-94ae-6995fccf5511', 
        'محمد حيدر محجوب'
      );
    `;

    // 3. Math class for tomorrow
    const tomorrowDay = DAYS_EN[(new Date().getDay() + 1) % 7];
    await sql`
      INSERT INTO class_schedules (grade, section, day_of_week, start_time, end_time, room, subject_name, teacher_id, teacher_name)
      VALUES (
        '1', 
        'عمر', 
        ${tomorrowDay}, 
        '08:00', 
        '09:30', 
        '101', 
        'الرياضيات', 
        '8afac8cb-85cf-4eb2-b41a-7c96ebf9ad12', 
        'معتصم علي فتاش'
      );
    `;

    console.log('Mock schedules inserted successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  }
}
run();

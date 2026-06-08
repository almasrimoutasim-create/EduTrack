import fs from 'fs';
import { neon } from '../server/db_compat.js';
import dotenv from 'dotenv';
dotenv.config();

// Teacher mapping
const teachersMap = {
  'الرياضيات': { id: '8afac8cb-85cf-4eb2-b41a-7c96ebf9ad12', name: 'معتصم علي فتاش' },
  'اللغة العربية': { id: 'ee132f64-29f1-4bff-94ae-6995fccf5511', name: 'محمد حيدر محجوب' },
  'اللغة الإنجليزية': { id: '84edf880-15b0-4a11-8cc9-b0343478697a', name: 'محمد خليفة حسن ' },
  'العلوم': { id: '8c7a0d68-0e7f-43a0-8d96-89c19965850c', name: 'محمد طارق بدرالدين' },
  'التربية الاسلامية': { id: '4598053d-5f5c-492f-9e2a-2d4efb21cb78', name: 'مصعب محمد ادريس' },
  'الجغرافيا': { id: 'e91c11a9-b5fc-4768-aca6-fc8b9bfcc82c', name: 'محجوب محمد الحسن' },
  'التاريخ': { id: '227fd7b4-71c3-448b-8d35-bae7602e85ab', name: 'هاجد محمد خير' },
  'اساسيات التربية التقنية': { id: 'c1bfea88-da4f-4dd9-9350-5f156985abdc', name: 'أسامة صالح بشير' },
  'علوم حاسوب': { id: 'ca7039a3-5fc2-408a-be74-e6a2037230fe', name: 'عماد محمد عباس' },
  'الأحياء': { id: 'c0a40bdc-d8d9-4978-9c38-b485a84fb8c4', name: 'حثام الدين عبدالرحمن' },
  'الكيمياء': { id: '8cf05ace-09dc-4149-a301-401180195c86', name: 'وضاح صديق عبدالله' },
  'الفيزياء': { id: '30e4aa42-5e3b-4db4-815c-fc2fd46fca90', name: 'أحمد زين العابدين' },
  'العلوم الهندسية': { id: 'bcc7f916-0f3a-4688-97f3-a3c07c45078b', name: 'أحمد يوسف عبدالله' }
};

// Map DOCX name to database subject name and teacher info
function mapSubject(name, grade) {
  name = name.trim();
  if (name === 'عربي') {
    return { subject_name: 'اللغة العربية', ...teachersMap['اللغة العربية'] };
  }
  if (name === 'رياضيات') {
    return { subject_name: 'الرياضيات', ...teachersMap['الرياضيات'] };
  }
  if (name === 'إنجليزي') {
    return { subject_name: 'اللغة الإنجليزية', ...teachersMap['اللغة الإنجليزية'] };
  }
  if (name === 'علوم') {
    return { subject_name: 'العلوم', ...teachersMap['العلوم'] };
  }
  if (name === 'إسلامية') {
    return { subject_name: 'التربية الاسلامية', ...teachersMap['التربية الاسلامية'] };
  }
  if (name === 'جغرافيا') {
    return { subject_name: 'الجغرافيا', ...teachersMap['الجغرافيا'] };
  }
  if (name === 'تاريخ') {
    return { subject_name: 'التاريخ', ...teachersMap['التاريخ'] };
  }
  if (name === 'تكنولوجيا') {
    if (grade === '10') {
      return { subject_name: 'علوم حاسوب', ...teachersMap['علوم حاسوب'] };
    }
    return { subject_name: 'اساسيات التربية التقنية', ...teachersMap['اساسيات التربية التقنية'] };
  }
  if (name === 'أحياء') {
    return { subject_name: 'الأحياء', ...teachersMap['الأحياء'] };
  }
  if (name === 'كيمياء') {
    return { subject_name: 'الكيمياء', ...teachersMap['الكيمياء'] };
  }
  if (name === 'فيزياء') {
    return { subject_name: 'الفيزياء', ...teachersMap['الفيزياء'] };
  }
  if (name === 'هندسية') {
    return { subject_name: 'العلوم الهندسية', ...teachersMap['العلوم الهندسية'] };
  }
  if (name === 'نشاط') {
    return { subject_name: 'نشاط', id: 'activity_teacher', name: 'معلم النشاط' };
  }
  if (name === 'إشراف') {
    return { subject_name: 'إشراف', id: 'supervision_teacher', name: 'مشرف الحصة' };
  }
  
  // Fallback
  return { subject_name: name, id: 'unknown_teacher', name: 'غير محدد' };
}

const dayMap = {
  'الأحد': 'Sunday',
  'الإثنين': 'Monday',
  'الثلاثاء': 'Tuesday',
  'الأربعاء': 'Wednesday',
  'الخميس': 'Thursday'
};

const periods = [
  { start_time: '08:00', end_time: '08:35' },
  { start_time: '08:40', end_time: '09:15' },
  { start_time: '09:20', end_time: '09:55' },
  { start_time: '10:15', end_time: '10:50' },
  { start_time: '10:55', end_time: '11:30' },
  { start_time: '11:35', end_time: '12:00' }
];

async function run() {
  const fileContent = fs.readFileSync('scratch/docx_content.txt', 'utf-8');
  const lines = fileContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const schedules = [];
  let currentGrade = null;
  let currentDay = null;
  let periodCounter = 0;
  
  const gradeMap = {
    'الصف الخامس': '5',
    'الصف السادس': '6',
    'الصف السابع': '7',
    'الصف الثامن': '8',
    'الصف التاسع': '9',
    'الصف العاشر': '10'
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line is a grade header
    if (gradeMap[line]) {
      currentGrade = gradeMap[line];
      currentDay = null;
      periodCounter = 0;
      continue;
    }
    
    // Skip Day header or Period headers info lines
    if (line === 'اليوم' || line.startsWith('1 (') || line.startsWith('2 (') || line.startsWith('3 (') || line.startsWith('4 (') || line.startsWith('5 (') || line.startsWith('6 (') || line.startsWith('جدول الحصص')) {
      continue;
    }
    
    // Check if line is a day
    if (dayMap[line]) {
      currentDay = dayMap[line];
      periodCounter = 0;
      continue;
    }
    
    // Otherwise, it must be a subject for the currentDay and currentGrade
    if (currentGrade && currentDay && periodCounter < 6) {
      const p = periods[periodCounter];
      const mapped = mapSubject(line, currentGrade);
      
      schedules.push({
        subject_name: mapped.subject_name,
        teacher_name: mapped.name,
        teacher_id: mapped.id,
        grade: currentGrade,
        section: 'A',
        day_of_week: currentDay,
        start_time: p.start_time,
        end_time: p.end_time,
        room: '101' // Default classroom room
      });
      
      periodCounter++;
    }
  }
  
  console.log(`Parsed ${schedules.length} schedule entries.`);
  
  // Now let's connect to db and insert
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set!');
    return;
  }
  
  const sql = neon(url);
  try {
    console.log('Inserting into database...');
    let successCount = 0;
    
    for (const s of schedules) {
      await sql`
        INSERT INTO class_schedules (
          id, subject_name, teacher_name, teacher_id, grade, section, day_of_week, start_time, end_time, room, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), ${s.subject_name}, ${s.teacher_name}, ${s.teacher_id}, ${s.grade}, ${s.section}, ${s.day_of_week}, ${s.start_time}, ${s.end_time}, ${s.room}, NOW(), NOW()
        )
      `;
      successCount++;
    }
    
    console.log(`Successfully inserted ${successCount} schedules!`);
  } catch (err) {
    console.error('Database insertion error:', err);
  }
}

run();

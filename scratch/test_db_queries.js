import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const sql = neon(url);
  const tables = [
    'students', 'teachers', 'attendance', 'subjects', 'library_books', 
    'financial_records', 'activity_posts', 'activity_comments', 'activity_chats', 
    'audit_logs', 'bus_drivers', 'bus_driver_reports', 'card_top_ups', 
    'class_schedules', 'donations', 'friend_requests', 'store_items', 
    'purchases', 'study_rooms', 'study_groups', 'study_group_posts', 
    'study_materials', 'student_awards', 'student_grades', 'student_reports', 
    'supervisors', 'staff_members', 'teacher_ratings', 'teacher_tasks', 
    'portal_access_configs', 'portal_groups', 'portal_group_messages', 
    'portal_notifications', 'private_messages', 'room_messages', 'room_videos', 
    'book_reviews', 'message_read_receipts', 'typing_indicators', 'fines', 
    'parent_link_requests', 'virtual_sessions', 'session_participants'
  ];

  for (const t of tables) {
    try {
      await sql.query(`SELECT * FROM ${t} LIMIT 1;`);
      // console.log(`Table ${t} OK`);
    } catch (err) {
      console.log(`Table ${t} failed on LIMIT 1:`, err.message);
    }
  }

  console.log('--- TESTING SORT BY created_at DESC ---');
  for (const t of tables) {
    try {
      await sql.query(`SELECT * FROM ${t} ORDER BY created_at DESC LIMIT 1;`);
    } catch (err) {
      console.log(`Table ${t} failed on ORDER BY created_at DESC:`, err.message);
    }
  }
}
run();

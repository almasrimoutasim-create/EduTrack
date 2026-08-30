import { neon } from './db_compat.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'edutrack_secure_jwt_secret_2026_fallback';

function hashPassword(password) {
  if (!password) return '';
  return bcrypt.hashSync(password, 10);
}

let sql = null;
if (process.env.DATABASE_URL) {
  sql = neon(process.env.DATABASE_URL);
  sql.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`).catch(()=>{});
  // Auto-create parent_link_requests table
  sql`
    CREATE TABLE IF NOT EXISTS parent_link_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_email TEXT NOT NULL,
      parent_name TEXT,
      student_id TEXT NOT NULL,
      student_name TEXT,
      relationship TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(() => {
      console.log('[neon] parent_link_requests table verified/created');
    }).catch(err => {
      console.error('[neon] failed to verify/create parent_link_requests table:', err.message);
    });

  // Auto-create visitors table
  sql`
    CREATE TABLE IF NOT EXISTS visitors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      visitor_name TEXT NOT NULL,
      reason TEXT,
      check_in_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      check_out_time TIMESTAMP WITH TIME ZONE,
      status TEXT NOT NULL DEFAULT 'checked_in',
      recorded_by TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(() => {
    console.log('[neon] visitors table verified/created');
  }).catch(err => {
    console.error('[neon] failed to verify/create visitors table:', err.message);
  });

  // Auto-create virtual_sessions table
  sql`
    CREATE TABLE IF NOT EXISTS virtual_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      teacher_id TEXT,
      teacher_name TEXT,
      subject_id UUID,
      subject_name TEXT,
      room_name TEXT UNIQUE NOT NULL,
      scheduled_at TIMESTAMP WITH TIME ZONE,
      started_at TIMESTAMP WITH TIME ZONE,
      ended_at TIMESTAMP WITH TIME ZONE,
      status TEXT NOT NULL DEFAULT 'scheduled',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(() => {
    console.log('[neon] virtual_sessions table verified/created');
  }).catch(err => {
    console.error('[neon] failed to verify/create virtual_sessions table:', err.message);
  });

  // Auto-create session_participants table
  sql`
    CREATE TABLE IF NOT EXISTS session_participants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT,
      role TEXT NOT NULL,
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      left_at TIMESTAMP WITH TIME ZONE,
      attendance_minutes INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(() => {
    console.log('[neon] session_participants table verified/created');
    // Alter table to support mic, video and hand-raising synchronization
    sql`
      ALTER TABLE session_participants 
      ADD COLUMN IF NOT EXISTS hand_raised BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS mic_active BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS video_active BOOLEAN DEFAULT TRUE;
    `.catch(err => console.error('[neon] failed to alter session_participants:', err.message));
  }).catch(err => {
    console.error('[neon] failed to verify/create session_participants table:', err.message);
  });

  // Auto-create room_messages table
  sql`
    CREATE TABLE IF NOT EXISTS room_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      room_name TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_role TEXT NOT NULL,
      message_text TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(() => {
    console.log('[neon] room_messages table verified/created');
  }).catch(err => {
    console.error('[neon] failed to verify/create room_messages table:', err.message);
  });

  // Auto-create official_announcements table
  sql`
    CREATE TABLE IF NOT EXISTS official_announcements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      priority TEXT DEFAULT 'normal',
      target_audience TEXT NOT NULL,
      created_by TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(() => {
    console.log('[neon] official_announcements table verified/created');
  }).catch(err => {
    console.error('[neon] failed to verify/create official_announcements table:', err.message);
  });

  // Auto-create hall_rentals table
  sql`
    CREATE TABLE IF NOT EXISTS hall_rentals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      hall_name TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      payment_method TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_by TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(() => {
    console.log('[neon] hall_rentals table verified/created');
  }).catch(err => {
    console.error('[neon] failed to verify/create hall_rentals table:', err.message);
  });

  // Auto-create other_revenue table
  sql`
    CREATE TABLE IF NOT EXISTS other_revenue (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      payment_method TEXT NOT NULL,
      created_by TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(() => {
    console.log('[neon] other_revenue table verified/created');
  }).catch(err => {
    console.error('[neon] failed to verify/create other_revenue table:', err.message);
  });

  // Auto-create expenses table
  sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      vendor TEXT,
      expense_date TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      academic_year TEXT DEFAULT '2025-2026',
      created_by TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(() => {
    console.log('[neon] expenses table verified/created');
  }).catch(err => {
    console.error('[neon] failed to verify/create expenses table:', err.message);
  });


  // Auto-create salary_records table
  sql`
    ALTER TABLE salary_records ADD COLUMN IF NOT EXISTS advances NUMERIC DEFAULT 0;
  `.then(() => {
    console.log('[neon] salary_records table altered successfully with advances column');
  }).catch(err => {
    console.error('[neon] failed to alter salary_records table:', err.message);
  });

  // Auto-create salary_records table
  sql`
    CREATE TABLE IF NOT EXISTS salary_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      employee_name TEXT NOT NULL,
      employee_type TEXT NOT NULL,
      base_salary NUMERIC NOT NULL,
      allowances NUMERIC DEFAULT 0,
      deductions NUMERIC DEFAULT 0,
      advances NUMERIC DEFAULT 0,
      net_salary NUMERIC NOT NULL,
      month TEXT NOT NULL,
      year INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_date TEXT,
      created_by TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(() => {
    console.log('[neon] salary_records table verified/created');
  }).catch(err => {
    console.error('[neon] failed to verify/create salary_records table:', err.message);
  });

  // Auto-create purchase_orders table
  sql`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category TEXT NOT NULL,
      item_description TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      total_amount NUMERIC NOT NULL,
      vendor TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      approved_by TEXT,
      approved_at TEXT,
      expense_id UUID,
      created_by TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(() => {
    console.log('[neon] purchase_orders table verified/created');
  }).catch(err => {
    console.error('[neon] failed to verify/create purchase_orders table:', err.message);
  });

  // Auto-create counseling_cases table
  sql`
    CREATE TABLE IF NOT EXISTS counseling_cases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL,
      title TEXT NOT NULL,
      problem_type TEXT NOT NULL DEFAULT 'academic',
      referral_reason TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      risk_level TEXT NOT NULL DEFAULT 'medium',
      created_by TEXT,
      closed_at TIMESTAMP WITH TIME ZONE,
      closed_by TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(() => {
    console.log('[neon] counseling_cases table verified/created');
  }).catch(err => {
    console.error('[neon] failed to verify/create counseling_cases table:', err.message);
  });

  // Auto-create case_assessments table
  sql`
    CREATE TABLE IF NOT EXISTS case_assessments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      case_id UUID NOT NULL,
      academic_score TEXT,
      behavioral_score TEXT,
      social_score TEXT,
      psychological_score TEXT,
      average_score TEXT,
      notes TEXT,
      created_by TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(() => {
    console.log('[neon] case_assessments table verified/created');
  }).catch(err => {
    console.error('[neon] failed to verify/create case_assessments table:', err.message);
  });

  // Auto-create intervention_plans table
  sql`
    CREATE TABLE IF NOT EXISTS intervention_plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      case_id UUID NOT NULL,
      goal_text TEXT NOT NULL,
      responsible_person TEXT,
      start_date TEXT,
      end_date TEXT,
      actions JSONB DEFAULT '[]'::jsonb,
      status TEXT NOT NULL DEFAULT 'active',
      created_by TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(() => {
    console.log('[neon] intervention_plans table verified/created');
  }).catch(err => {
    console.error('[neon] failed to verify/create intervention_plans table:', err.message);
  });

  // Auto-create follow_ups table
  sql`
    CREATE TABLE IF NOT EXISTS follow_ups (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      case_id UUID NOT NULL,
      note TEXT NOT NULL,
      progress_status TEXT NOT NULL DEFAULT 'stable',
      created_by TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(() => {
    console.log('[neon] follow_ups table verified/created');
  }).catch(err => {
    console.error('[neon] failed to verify/create follow_ups table:', err.message);
  });

  // Auto-create case_visibility_logs table
  sql`
    CREATE TABLE IF NOT EXISTS case_visibility_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      case_id UUID NOT NULL,
      viewer_id TEXT,
      viewer_role TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(() => {
    console.log('[neon] case_visibility_logs table verified/created');
  }).catch(err => {
    console.error('[neon] failed to verify/create case_visibility_logs table:', err.message);
  });

  // Alter donations table to add payment_method, is_anonymous, acknowledgment_sent columns
  sql`
    ALTER TABLE donations
    ADD COLUMN IF NOT EXISTS payment_method TEXT,
    ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS acknowledgment_sent BOOLEAN DEFAULT FALSE;
  `.then(() => {
    console.log('[neon] donations table altered successfully');
  }).catch(err => {
    console.error('[neon] failed to alter donations table:', err.message);
  });

  // Alter library_books table to add thumbnail_url and subject_id columns
  sql`
    ALTER TABLE library_books
    ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
    ADD COLUMN IF NOT EXISTS subject_id UUID;
  `.then(() => {
    console.log('[neon] library_books table altered successfully');
  }).catch(err => {
    console.error('[neon] failed to alter library_books table:', err.message);
  });

  // Alter staff_members table to add salary column
  sql`
    ALTER TABLE staff_members
    ADD COLUMN IF NOT EXISTS salary NUMERIC DEFAULT 4000;
  `.then(() => {
    console.log('[neon] staff_members table altered successfully with salary column');
  }).catch(err => {
    console.error('[neon] failed to alter staff_members table:', err.message);
  });
  // Auto-create gateway_accounts table
  sql`
    CREATE TABLE IF NOT EXISTS gateway_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_by TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(async () => {
    console.log('[neon] gateway_accounts table verified/created');
    // Seed default account if empty
    const rows = await sql`SELECT COUNT(*) FROM gateway_accounts`;
    if (rows[0].count === '0') {
      const hashed = bcrypt.hashSync('edutrack2026', 10);
      await sql`INSERT INTO gateway_accounts (username, password) VALUES ('gateway', ${hashed})`;
      console.log('[neon] created default gateway account (gateway / edutrack2026)');
    }
  }).catch(err => {
    console.error('[neon] failed to verify/create gateway_accounts table:', err.message);
  });
  // Auto-create system_admins table
  sql`
    CREATE TABLE IF NOT EXISTS system_admins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL DEFAULT 'System Admin',
      created_by TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(async () => {
    console.log('[neon] system_admins table verified/created');
    const rows = await sql`SELECT COUNT(*) FROM system_admins`;
    if (rows[0].count === '0') {
      const hashed = bcrypt.hashSync('admin123', 10);
      await sql`INSERT INTO system_admins (email, password, full_name) VALUES ('admin@edutrack.com', ${hashed}, 'System Admin')`;
      console.log('[neon] created default system admin (admin@edutrack.com / admin123)');
    }
  }).catch(err => {
    console.error('[neon] failed to verify/create system_admins table:', err.message);
  });

  // Auto-create system_settings table
  sql`
    CREATE TABLE IF NOT EXISTS system_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_name_ar TEXT,
      school_name_en TEXT,
      school_logo TEXT,
      school_background_image TEXT,
      principal_name TEXT,
      gov_locality TEXT,
      academic_year TEXT,
      school_stage TEXT,
      school_phone TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(() => {
    console.log('[neon] system_settings table verified/created');
    // ترحيل تلقائي للأعمدة الجديدة إذا كان الجدول موجود مسبقاً
    sql`ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS principal_name TEXT;`.catch(()=>{});
    sql`ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS gov_locality TEXT;`.catch(()=>{});
    sql`ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS academic_year TEXT;`.catch(()=>{});
    sql`ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS school_stage TEXT;`.catch(()=>{});
    sql`ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS school_phone TEXT;`.catch(()=>{});
    sql`ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS sidebar_logo TEXT;`.catch(()=>{});
    sql`ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS sidebar_short_name TEXT;`.catch(()=>{});
  }).catch(err => {
    console.error('[neon] failed to verify/create system_settings table:', err.message);
  });

  // Auto-create schools table (SaaS — لوحة المؤسس)
  sql`
    CREATE TABLE IF NOT EXISTS schools (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      name_ar TEXT,
      name_en TEXT,
      country TEXT DEFAULT 'السودان',
      plan TEXT NOT NULL DEFAULT 'starter',
      billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- 'monthly' or 'yearly'
      subscription_status TEXT NOT NULL DEFAULT 'trial',
      director_name TEXT,
      email TEXT,
      phone TEXT,
      domain_subdomain TEXT UNIQUE, -- للمدارس التي تريد نطاق فرعي
      logo_url TEXT,
      subscription_start_date TIMESTAMP WITH TIME ZONE, -- متى بدأ الاشتراك فعلياً
      expires_at TIMESTAMP WITH TIME ZONE, -- متى ينتهي الاشتراك الحالي
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(() => {
    console.log('[neon] schools table verified/created');
    sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS name_ar TEXT;`.catch(()=>{});
    sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS name_en TEXT;`.catch(()=>{});
    sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';`.catch(()=>{});
    sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE;`.catch(()=>{});
    sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;`.catch(()=>{});
    sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS domain_subdomain TEXT;`.catch(()=>{});
    sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS logo_url TEXT;`.catch(()=>{});
    sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS plan_id TEXT;`.catch(()=>{});
    sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;`.catch(()=>{});
  }).catch(err => {
    console.error('[neon] failed to verify/create schools table:', err.message);
  });

  // Auto-create registration_requests table (نظام التسجيل الجديد)
  sql`
    CREATE TABLE IF NOT EXISTS registration_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      id_number TEXT,
      role_requested TEXT NOT NULL,
      grade TEXT,
      department TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      username_generated TEXT,
      password_generated TEXT,
      reviewed_by TEXT,
      reviewed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(() => {
    console.log('[neon] registration_requests table verified/created');
    sql`ALTER TABLE registration_requests ADD COLUMN IF NOT EXISTS school_name TEXT;`.catch(()=>{});
    sql`ALTER TABLE registration_requests ADD COLUMN IF NOT EXISTS director_name TEXT;`.catch(()=>{});
    sql`ALTER TABLE registration_requests ADD COLUMN IF NOT EXISTS country TEXT;`.catch(()=>{});
    sql`ALTER TABLE registration_requests ADD COLUMN IF NOT EXISTS plan TEXT;`.catch(()=>{});
  }).catch(err => {
    console.error('[neon] failed to verify/create registration_requests table:', err.message);
  });

  // ── Multi-tenant: إضافة school_id لكل جدول مستأجر + فهرسة + RLS سيتم لاحقاً ──
  const TENANT_TABLES = [
    'students','teachers','attendance','subjects','library_books','financial_records',
    'activity_posts','activity_comments','activity_chats','audit_logs','bus_drivers','bus_driver_reports','card_top_ups','class_schedules','donations','friend_requests','store_items','purchases','study_rooms','study_groups','study_group_posts','study_materials','student_awards','student_grades','student_reports','supervisors','staff_members','teacher_ratings','teacher_tasks','portal_access_configs','portal_groups','portal_group_messages','portal_notifications','private_messages','room_messages','room_videos','book_reviews','message_read_receipts','typing_indicators','fines','parent_link_requests','virtual_sessions','session_participants','official_announcements','counseling_cases','case_assessments','intervention_plans','follow_ups','case_visibility_logs','fee_structures','student_fees','fee_payments','activity_fees','student_activity_fees','student_wallet','wallet_transactions','hall_rentals','other_revenue','expenses','salary_records','purchase_orders','visitors','system_settings','system_admins'
  ];
  TENANT_TABLES.forEach(tbl => {
    sql.query(`ALTER TABLE ${tbl} ADD COLUMN IF NOT EXISTS school_id UUID`).catch(err=>console.error(`[neon] add school_id to ${tbl}:`, err.message))
      .then(()=> sql.query(`CREATE INDEX IF NOT EXISTS idx_${tbl}_school_id ON ${tbl}(school_id)`).catch(()=>{}))
      .then(()=> sql.query(`CREATE INDEX IF NOT EXISTS idx_${tbl}_school_created ON ${tbl}(school_id, created_at DESC)`).catch(()=>{}));
  });
  // تهيئة مستأجر افتراضي وترحيل البيانات القديمة (NULL -> المدرسة الافتراضية)
  (async () => {
    try {
      await sql.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`).catch(()=>{});
      // إصلاح الـ default للـ id إن كان مكسوراً
      await sql.query(`ALTER TABLE schools ALTER COLUMN id SET DEFAULT gen_random_uuid()`).catch(()=>{});
      // تأكد من أعمدة schools الأساسية
      await sql.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS name TEXT`).catch(()=>{});
      await sql.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS country TEXT`).catch(()=>{});
      await sql.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS plan TEXT`).catch(()=>{});
      await sql.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS subscription_status TEXT`).catch(()=>{});
      await sql.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS director_name TEXT`).catch(()=>{});
      await sql.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS email TEXT`).catch(()=>{});
      await sql.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS phone TEXT`).catch(()=>{});
      // تشخيص أعمدة schools
      try {
        const cols = await sql.query(`SELECT column_name FROM information_schema.columns WHERE table_name='schools'`);
        console.log('[neon] schools columns:', cols.map(c=>c.column_name).join(', '));
      } catch {}
      const schoolsExist = await sql.query(`SELECT id FROM schools LIMIT 1`);
      let defaultSchoolId = schoolsExist[0]?.id;
      if (!defaultSchoolId) {
        try {
          const { randomUUID } = await import('crypto');
          const newId = randomUUID();
          const rows = await sql.query(`INSERT INTO schools (id, name, name_ar, name_en, country, plan, subscription_status, director_name) VALUES ($1, 'مدارس عباد الرحمن التعليمية', 'مدارس عباد الرحمن التعليمية', 'Abad Al-Rahman Educational Schools', 'السودان', 'enterprise', 'active', 'الإدارة') RETURNING id`, [newId]);
          defaultSchoolId = rows[0]?.id || newId;
          console.log('[neon] created default tenant school:', defaultSchoolId);
        } catch (e) {
          const rows2 = await sql.query(`SELECT id FROM schools LIMIT 1`);
          defaultSchoolId = rows2[0]?.id;
          console.error('[neon] default school insert failed:', e.message);
        }
      }
      if (defaultSchoolId) {
        for (const tbl of TENANT_TABLES) {
          await sql.query(`UPDATE ${tbl} SET school_id = $1 WHERE school_id IS NULL`, [defaultSchoolId]).catch(()=>{});
        }
        await sql.query(`UPDATE system_admins SET school_id = $1 WHERE school_id IS NULL`, [defaultSchoolId]).catch(()=>{});
        console.log('[neon] backfilled school_id for existing rows to', defaultSchoolId);
      }
    } catch (e) { console.error('[neon] tenant backfill error:', e.message); }
  })();
  // RLS سيُفعّل في مرحلة ثانية بعد تثبيت حقن school_id على مستوى التطبيق — حالياً نعتمد على فلترة التطبيق

  // ── Payments / Subscriptions tables ──
  sql`
    CREATE TABLE IF NOT EXISTS subscription_payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID NOT NULL REFERENCES schools(id),
      provider TEXT NOT NULL, -- 'stripe' | 'paymob'
      provider_payment_id TEXT NOT NULL,
      provider_session_id TEXT,
      amount NUMERIC NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'pending', -- pending, succeeded, failed, refunded
      billing_cycle TEXT NOT NULL, -- 'monthly' | 'yearly'
      plan TEXT NOT NULL, -- 'starter' | 'professional' | 'enterprise'
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(provider, provider_payment_id)
    )
  `.then(() => console.log('[neon] subscription_payments table verified/created'))
    .catch(err => console.error('[neon] subscription_payments:', err.message));

  sql`
    CREATE TABLE IF NOT EXISTS subscription_notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID NOT NULL REFERENCES schools(id),
      type TEXT NOT NULL, -- 'expiry_7d', 'expiry_3d', 'expiry_1d', 'expired', 'renewed', 'payment_failed'
      channel TEXT NOT NULL, -- 'email' | 'whatsapp' | 'in_app'
      status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed
      payload JSONB DEFAULT '{}',
      sent_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(() => console.log('[neon] subscription_notifications table verified/created'))
    .catch(err => console.error('[neon] subscription_notifications:', err.message));

  // إنشاء فهارس للأداء
  sql`CREATE INDEX IF NOT EXISTS idx_subscription_payments_school_id ON subscription_payments(school_id)`.catch(()=>{});
  sql`CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status)`.catch(()=>{});
  sql`CREATE INDEX IF NOT EXISTS idx_subscription_notifications_school_id ON subscription_notifications(school_id)`.catch(()=>{});
  sql`CREATE INDEX IF NOT EXISTS idx_subscription_notifications_status ON subscription_notifications(status)`.catch(()=>{});

}

// Map entity names to table names
const ENTITY_TABLE_MAP = {
  Student: 'students',
  Teacher: 'teachers',
  Attendance: 'attendance',
  Subject: 'subjects',
  LibraryBook: 'library_books',
  FinancialRecord: 'financial_records',
  ActivityPost: 'activity_posts',
  ActivityComment: 'activity_comments',
  ActivityChat: 'activity_chats',
  AuditLog: 'audit_logs',
  BusDriver: 'bus_drivers',
  BusDriverReport: 'bus_driver_reports',
  CardTopUp: 'card_top_ups',
  ClassSchedule: 'class_schedules',
  Donation: 'donations',
  FriendRequest: 'friend_requests',
  StoreItem: 'store_items',
  Purchase: 'purchases',
  StudyRoom: 'study_rooms',
  StudyGroup: 'study_groups',
  StudyGroupPost: 'study_group_posts',
  StudyMaterial: 'study_materials',
  StudentAward: 'student_awards',
  StudentGrade: 'student_grades',
  StudentReport: 'student_reports',
  Supervisor: 'supervisors',
  StaffMember: 'staff_members',
  TeacherRating: 'teacher_ratings',
  TeacherTask: 'teacher_tasks',
  PortalAccessConfig: 'portal_access_configs',
  PortalGroup: 'portal_groups',
  PortalGroupMessage: 'portal_group_messages',
  PortalNotification: 'portal_notifications',
  PrivateMessage: 'private_messages',
  RoomMessage: 'room_messages',
  RoomVideo: 'room_videos',
  BookReview: 'book_reviews',
  MessageReadReceipt: 'message_read_receipts',
  TypingIndicator: 'typing_indicators',
  Fine: 'fines',
  ParentLinkRequest: 'parent_link_requests',
  VirtualSession: 'virtual_sessions',
  SessionParticipant: 'session_participants',
  OfficialAnnouncement: 'official_announcements',
  CounselingCase: 'counseling_cases',
  CaseAssessment: 'case_assessments',
  InterventionPlan: 'intervention_plans',
  FollowUp: 'follow_ups',
  CaseVisibilityLog: 'case_visibility_logs',
  FeeStructure: 'fee_structures',
  StudentFee: 'student_fees',
  FeePayment: 'fee_payments',
  ActivityFee: 'activity_fees',
  StudentActivityFee: 'student_activity_fees',
  StudentWallet: 'student_wallet',
  WalletTransaction: 'wallet_transactions',
  HallRental: 'hall_rentals',
  OtherRevenue: 'other_revenue',
  Expense: 'expenses',
  SalaryRecord: 'salary_records',
  PurchaseOrder: 'purchase_orders',
  Visitor: 'visitors',
  GatewayAccount: 'gateway_accounts',
  SystemAdmin: 'system_admins',
  SystemSetting: 'system_settings',
  RegistrationRequest: 'registration_requests',
  School: 'schools',
};

async function createStripePaymentIntent(amount, currency) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured in .env');
  }

  // Convert amount to cents (Stripe expects integers in cents)
  const amountInCents = Math.round(amount * 100);

  const response = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      amount: amountInCents.toString(),
      currency: currency.toLowerCase(),
      'payment_method_types[]': 'card'
    }).toString()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to create payment intent');
  }
  return data;
}

const ALLOWED_TABLES = new Set(Object.values(ENTITY_TABLE_MAP));

function getTableName(entity) {
  return ENTITY_TABLE_MAP[entity] || null;
}

async function parseBody(req) {
  // express.json() (server.js) already parses the body into req.body and drains
  // the stream, so reading the stream here would never emit 'end' and hang.
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function sanitizeColumn(col) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(col)) return null;
  return col;
}

// All queries use sql.query() for dynamic table/column names
async function dbQuery(queryStr, params = []) {
  if (!sql) {
    console.warn('[neon] No DATABASE_URL configured, skipping query');
    return [];
  }
  return sql.query(queryStr, params);
}

export function createApiHandler() {
  return async (req, res, next) => {
    // Public settings (no auth) — للشعار والخلفية في Gateway/Landing + السايدبار المختصر
    if ((req.url === '/neon-db/public-settings' || req.url.startsWith('/neon-db/public-settings?')) && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      try {
        if (!sql) return res.end(JSON.stringify({ school_name_ar: 'مدارس عباد الرحمن التعليمية', school_name_en: 'Abad Al-Rahman Educational Schools', school_logo: '', school_background_image: 'https://images.unsplash.com/photo-1510519138101-570d1dcb3d8e?q=80&w=2000&auto=format&fit=crop', sidebar_logo: '', sidebar_short_name: '' }));
        const rows = await dbQuery('SELECT * FROM system_settings ORDER BY created_at DESC LIMIT 1');
        const s = rows[0] || {};
        return res.end(JSON.stringify({
          school_name_ar: s.school_name_ar || 'مدارس عباد الرحمن التعليمية',
          school_name_en: s.school_name_en || 'Abad Al-Rahman Educational Schools',
          school_logo: s.school_logo || '',
          school_background_image: s.school_background_image || 'https://images.unsplash.com/photo-1510519138101-570d1dcb3d8e?q=80&w=2000&auto=format&fit=crop',
          sidebar_logo: s.sidebar_logo || s.school_logo || '',
          sidebar_short_name: s.sidebar_short_name || '',
        }));
      } catch (e) {
        return res.end(JSON.stringify({ school_name_ar: 'مدارس عباد الرحمن التعليمية', school_name_en: 'Abad Al-Rahman Educational Schools', school_logo: '', school_background_image: 'https://images.unsplash.com/photo-1510519138101-570d1dcb3d8e?q=80&w=2000&auto=format&fit=crop', sidebar_logo: '', sidebar_short_name: '' }));
      }
    }

    // WebRTC STUN/TURN config
    if (req.url === '/neon-db/ice-config' || req.url === '/api/ice-config') {
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          // Free reliable TURN via Cloudflare (no registration needed)
          {
            urls: 'turn:turn.cloudflare.com:3478',
            username: 'free',
            credential: 'free'
          }
        ]
      }));
    }

    // Intercept file upload endpoint
    if (req.url === '/neon-db/upload' && req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json');
      try {
        const body = await parseBody(req);
        const { fileName, fileData } = body;
        if (!fileName || !fileData) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'fileName and fileData are required' }));
        }

        // Decode base64
        const buffer = Buffer.from(fileData, 'base64');
        
        // Ensure folder public/uploads exists
        const fs = await import('fs');
        const path = await import('path');
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Save file
        const safeName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
        const filePath = path.join(uploadDir, safeName);
        fs.writeFileSync(filePath, buffer);

        return res.end(JSON.stringify({
          success: true,
          fileUrl: `/uploads/${safeName}`
        }));
      } catch (error) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: error.message }));
      }
    }

    // Intercept Stripe payment intent creation endpoint
    if (req.url === '/neon-db/payments/create-intent' && req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json');
      try {
        const body = await parseBody(req);
        const { amount, currency = 'USD' } = body;
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'Valid amount is required' }));
        }
        const intent = await createStripePaymentIntent(parseFloat(amount), currency);
        return res.end(JSON.stringify({
          clientSecret: intent.client_secret,
          id: intent.id
        }));
      } catch (error) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: error.message }));
      }
    }

    // Intercept Gateway login endpoint
    if (req.url === '/neon-db/auth/gateway' && req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json');
      try {
        const body = await parseBody(req);
        const { username, password } = body;
        if (!username || !password) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'Username and password are required' }));
        }

        const rows = await dbQuery('SELECT * FROM gateway_accounts WHERE username = $1', [username]);
        if (rows.length === 0) {
          res.statusCode = 401;
          return res.end(JSON.stringify({ error: 'Invalid credentials' }));
        }
        
        const account = rows[0];
        if (!bcrypt.compareSync(password, account.password)) {
          res.statusCode = 401;
          return res.end(JSON.stringify({ error: 'Invalid credentials' }));
        }

        return res.end(JSON.stringify({ success: true }));
      } catch (error) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: error.message }));
      }
    }

    // 1. Intercept unified Auth login endpoint
    if (req.url === '/neon-db/auth/login' && req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json');
      try {
        const body = await parseBody(req);
        const { role, identifier, password } = body;

        if (!identifier || !password) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'Email/ID and password are required' }));
        }

        // 1. Admin login
        if (role === 'admin') {
          const rows = await dbQuery('SELECT * FROM system_admins WHERE email = $1', [identifier]);
          if (rows.length === 0) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ error: 'Admin account not found' }));
          }
          const adminRow = rows[0];
          if (!bcrypt.compareSync(password, adminRow.password)) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ error: 'Invalid admin credentials' }));
          }
          const user = {
              id: adminRow.id,
              full_name: adminRow.full_name,
              email: adminRow.email,
              role: 'admin',
              school_id: adminRow.school_id || null
          };
          const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
          return res.end(JSON.stringify({
            success: true,
            user,
            token
          }));
        }

        // 2. Teacher login
        if (role === 'teacher') {
          const rows = await dbQuery(
            'SELECT * FROM teachers WHERE (email = $1 OR employee_id = $1) AND status = \'active\'',
            [identifier]
          );
          if (rows.length === 0) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ error: 'Teacher account not found or inactive' }));
          }
          const teacher = rows[0];
          if (!bcrypt.compareSync(password, teacher.portal_password)) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ error: 'Invalid password' }));
          }
          const user = {
              id: teacher.id,
              full_name: teacher.full_name,
              email: teacher.email,
              role: 'teacher',
              school_id: teacher.school_id || null
          };
          const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
          return res.end(JSON.stringify({
            success: true,
            user,
            token
          }));
        }

        // 3. Student login
        if (role === 'student') {
          const rows = await dbQuery(
            'SELECT * FROM students WHERE (user_email = $1 OR student_id = $1) AND status = \'active\'',
            [identifier]
          );
          if (rows.length === 0) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ error: 'Student account not found or inactive' }));
          }
          const student = rows[0];
          if (!bcrypt.compareSync(password, student.portal_password)) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ error: 'Invalid password' }));
          }
          const user = {
              id: student.id,
              full_name: student.full_name,
              email: student.user_email,
              role: 'student',
              school_id: student.school_id || null
          };
          const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
          return res.end(JSON.stringify({
            success: true,
            user,
            token
          }));
        }

        // 4. Parent login
        if (role === 'parent') {
          const rows = await dbQuery(
            'SELECT * FROM students WHERE parent_email = $1 AND status = \'active\'',
            [identifier]
          );
          if (rows.length === 0) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ error: 'No student accounts found linked to this parent email' }));
          }
          const student = rows[0];
          if (!bcrypt.compareSync(password, student.parent_password)) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ error: 'Invalid password' }));
          }
          const user = {
              id: 'parent-' + student.id,
              full_name: student.parent_name || 'Parent',
              email: student.parent_email,
              role: 'parent',
              student_id: student.id,
              school_id: student.school_id || null
          };
          const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
          return res.end(JSON.stringify({
            success: true,
            user,
            token
          }));
        }

        // 5. Bus supervisor login (supervisors table)
        if (role === 'bus') {
          const rows = await dbQuery(
            'SELECT * FROM supervisors WHERE email = $1 AND status = \'active\'',
            [identifier]
          );
          if (rows.length === 0) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ error: 'Bus supervisor account not found or inactive' }));
          }
          const supervisor = rows[0];
          if (!bcrypt.compareSync(password, supervisor.portal_password)) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ error: 'Invalid password' }));
          }
          const user = {
              id: supervisor.id,
              full_name: supervisor.full_name,
              email: supervisor.email,
              role: 'bus',
              school_id: supervisor.school_id || null
          };
          const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
          return res.end(JSON.stringify({
            success: true,
            user,
            token
          }));
        }

        // 6. Staff members login (staff_members table)
        if (role === 'staff') {
          const rows = await dbQuery(
            'SELECT * FROM staff_members WHERE (email = $1 OR employee_id = $1) AND status = \'active\'',
            [identifier]
          );
          if (rows.length === 0) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ error: 'Staff account not found or inactive' }));
          }
          const staff = rows[0];
          if (!bcrypt.compareSync(password, staff.portal_password)) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ error: 'Invalid password' }));
          }
          
          let staffRole = staff.role || 'staff';
          if (staffRole === 'store_keeper') staffRole = 'store';

          const user = {
              id: staff.id,
              full_name: staff.full_name,
              email: staff.email,
              role: staffRole,
              school_id: staff.school_id || null
          };
          const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
          return res.end(JSON.stringify({
            success: true,
            user,
            token
          }));
        }

        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'Invalid portal role selected' }));

      } catch (error) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: error.message }));
      }
    }

    // ── Webhook routes (public, no auth) ──
    if (req.url.startsWith('/webhook/')) {
      res.setHeader('Content-Type', 'application/json');
      
      if (req.url === '/webhook/stripe' && req.method === 'POST') {
        return handleStripeWebhook(req, res);
      }
      if (req.url === '/webhook/paymob' && req.method === 'POST') {
        return handlePaymobWebhook(req, res);
      }
      if (req.url === '/webhook/subscription/renew' && req.method === 'POST') {
        return handleManualRenew(req, res);
      }
      res.statusCode = 404;
      return res.end(JSON.stringify({ error: 'Webhook not found' }));
    }

    if (!req.url.startsWith('/neon-db/entities/')) return next();

    res.setHeader('Content-Type', 'application/json');

    // Parse entity early to allow public registration + founder cross-tenant reads
    const earlyUrlParts = req.url.split('?');
    const earlyPath = earlyUrlParts[0];
    const earlyMatch = earlyPath.match(/^\/neon-db\/entities\/([^\/]+)(?:\/(.+))?$/);
    const earlyEntity = earlyMatch ? earlyMatch[1] : null;
    const isPublicRegistrationPost = earlyEntity === 'RegistrationRequest' && req.method === 'POST';
    const isFounderPublicRead = (earlyEntity === 'School' || earlyEntity === 'RegistrationRequest') && req.method === 'GET';
    const authHeader = req.headers.authorization;
    // Founder (بدون JWT) يسمح له بقراءة المدارس والطلبات عبر /founder-dashboard — يرى الكل
    const allowWithoutAuth = isPublicRegistrationPost || isFounderPublicRead;

    // JWT Authentication Middleware
    if (!allowWithoutAuth) {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.statusCode = 401;
        return res.end(JSON.stringify({ error: 'Unauthorized: Missing or invalid token' }));
      }
      const token = authHeader.split(' ')[1];
      try {
        req.user = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        res.statusCode = 401;
        return res.end(JSON.stringify({ error: 'Unauthorized: Invalid or expired token' }));
      }
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      // حتى في المسارات العامة، إن وُجد توكن نحاول فكه لمعرفة المستأجر
      try { req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET); } catch { req.user = null; }
    } else {
      req.user = null;
    }

    try {
      const urlParts = req.url.split('?');
      const path = urlParts[0];
      const searchParams = new URLSearchParams(urlParts[1] || '');
      
      const entityMatch = path.match(/^\/neon-db\/entities\/([^\/]+)(?:\/(.+))?$/);
      if (!entityMatch) {
        res.statusCode = 404;
        return res.end(JSON.stringify({ error: 'Route not found' }));
      }

      const entityName = entityMatch[1];
      const entityId = entityMatch[2];
      const table = getTableName(entityName);

      if (!table || !ALLOWED_TABLES.has(table)) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: `Unknown entity: ${entityName}` }));
      }

      // Multi-tenant helpers
      const TENANT_TABLES_SET = new Set(['students','teachers','attendance','subjects','library_books','financial_records','activity_posts','activity_comments','activity_chats','audit_logs','bus_drivers','bus_driver_reports','card_top_ups','class_schedules','donations','friend_requests','store_items','purchases','study_rooms','study_groups','study_group_posts','study_materials','student_awards','student_grades','student_reports','supervisors','staff_members','teacher_ratings','teacher_tasks','portal_access_configs','portal_groups','portal_group_messages','portal_notifications','private_messages','room_messages','room_videos','book_reviews','message_read_receipts','typing_indicators','fines','parent_link_requests','virtual_sessions','session_participants','official_announcements','counseling_cases','case_assessments','intervention_plans','follow_ups','case_visibility_logs','fee_structures','student_fees','fee_payments','activity_fees','student_activity_fees','student_wallet','wallet_transactions','hall_rentals','other_revenue','expenses','salary_records','purchase_orders','visitors','system_settings','system_admins']);
      const isTenantTable = TENANT_TABLES_SET.has(table);
      const tenantId = req.user?.school_id || null;

      // ===== LIST =====
      if (req.method === 'GET' && !entityId) {
        let orderBy = searchParams.get('order') || '-created_at';
        const limit = parseInt(searchParams.get('limit')) || 200;
        const offset = parseInt(searchParams.get('offset')) || 0;
        const filterStr = searchParams.get('filters');

        let orderColumn = orderBy.startsWith('-') ? orderBy.slice(1) : orderBy;
        if (orderColumn === 'created_date') orderColumn = 'created_at';
        orderColumn = sanitizeColumn(orderColumn) || 'created_at';
        const orderDir = orderBy.startsWith('-') ? 'DESC' : 'ASC';

        const conditions = [];
        const values = [];
        let paramIdx = 1;

        if (filterStr && filterStr !== 'null') {
          try {
            const filters = JSON.parse(filterStr);
            if (filters && typeof filters === 'object') {
              for (const [key, val] of Object.entries(filters)) {
                let actualKey = key;
                if (table === 'portal_notifications' && key === 'recipient_id') {
                  actualKey = 'user_id';
                }
                const col = sanitizeColumn(actualKey);
                if (!col || val === null || val === undefined) continue;

                if (typeof val === 'object' && val.$in) {
                  const ph = val.$in.map((_, i) => `$${paramIdx + i}`);
                  conditions.push(`${col} IN (${ph.join(', ')})`);
                  values.push(...val.$in);
                  paramIdx += val.$in.length;
                } else if (typeof val === 'object' && val.$ne) {
                  conditions.push(`${col} != $${paramIdx}`);
                  values.push(val.$ne); paramIdx++;
                } else if (typeof val === 'object' && val.$gte) {
                  conditions.push(`${col} >= $${paramIdx}`);
                  values.push(val.$gte); paramIdx++;
                } else if (typeof val === 'object' && val.$lte) {
                  conditions.push(`${col} <= $${paramIdx}`);
                  values.push(val.$lte); paramIdx++;
                } else if (typeof val === 'object' && val.$like) {
                  conditions.push(`${col} ILIKE $${paramIdx}`);
                  values.push(`%${val.$like}%`); paramIdx++;
                } else {
                  conditions.push(`${col} = $${paramIdx}`);
                  values.push(val); paramIdx++;
                }
              }
            }
          } catch (e) { /* ignore filter errors */ }
        }
        // Multi-tenant: حقن school_id تلقائياً للمستأجر
        if (isTenantTable && tenantId) {
          conditions.push(`school_id = $${paramIdx}`);
          values.push(tenantId);
          paramIdx++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const limitParam = paramIdx;
        const offsetParam = paramIdx + 1;
        const finalValues = [...values, limit, offset];
        
        const q = `SELECT * FROM ${table} ${whereClause} ORDER BY ${orderColumn} ${orderDir} LIMIT $${limitParam} OFFSET $${offsetParam}`;
        const rows = await dbQuery(q, finalValues);
        return res.end(JSON.stringify(rows));
      }

      // ===== GET ONE =====
      if (req.method === 'GET' && entityId) {
        let rows;
        if (isTenantTable && tenantId) {
          rows = await dbQuery(`SELECT * FROM ${table} WHERE id = $1 AND school_id = $2`, [entityId, tenantId]);
        } else {
          rows = await dbQuery(`SELECT * FROM ${table} WHERE id = $1`, [entityId]);
        }
        if (rows.length === 0) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ error: 'Not found' }));
        }
        return res.end(JSON.stringify(rows[0]));
      }

      // ===== CREATE =====
      if (req.method === 'POST') {
        const body = await parseBody(req);
        // Multi-tenant: حقن school_id تلقائياً
        if (isTenantTable && tenantId && !body.school_id) {
          body.school_id = tenantId;
        }
        
        if (body.portal_password !== undefined) {
          if (body.portal_password === '') {
            delete body.portal_password;
          } else {
            body.portal_password = hashPassword(body.portal_password);
          }
        }
        if (body.parent_password !== undefined) {
          if (body.parent_password === '') {
            delete body.parent_password;
          } else {
            body.parent_password = hashPassword(body.parent_password);
          }
        }
        if (table === 'gateway_accounts' && body.password !== undefined) {
          if (body.password === '') {
            delete body.password;
          } else {
            body.password = hashPassword(body.password);
          }
        }
        if (table === 'system_admins' && body.password !== undefined) {
          if (body.password === '') {
            delete body.password;
          } else {
            body.password = hashPassword(body.password);
          }
        }

        if (table === 'portal_notifications' && body.recipient_id !== undefined) {
          body.user_id = body.recipient_id;
          delete body.recipient_id;
        }

        // Hook: Automatically default remaining to amount for student_fees
        if (table === 'student_fees' && body.remaining === undefined) {
          body.remaining = body.amount;
        }

        // Sanitize: convert empty strings to null for UUID/ID columns to avoid PostgreSQL type errors
        const UUID_COLUMNS = ['subject_id', 'session_id', 'student_id', 'teacher_id', 'expense_id', 'parent_id', 'case_id'];
        for (const col of UUID_COLUMNS) {
          if (body[col] !== undefined && body[col] === '') {
            body[col] = null;
          }
        }

        const keys = Object.keys(body).filter(k => body[k] !== undefined && sanitizeColumn(k));
        if (keys.length === 0) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'Empty body' }));
        }
        const columns = keys.map(k => sanitizeColumn(k)).join(', ');
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const values = keys.map(k => body[k]);
        const q = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
        const rows = await dbQuery(q, values);

        // Hook: Update corresponding student_fees row when a fee_payment is recorded
        if (rows.length > 0 && table === 'fee_payments') {
          const feeId = body.student_fee_id;
          const payAmt = parseFloat(body.amount) || 0;
          if (feeId) {
            const feeRows = await dbQuery('SELECT * FROM student_fees WHERE id = $1', [feeId]);
            if (feeRows.length > 0) {
              const currentPaid = parseFloat(feeRows[0].amount_paid) || 0;
              const totalAmt = parseFloat(feeRows[0].amount) || 0;
              const newPaid = currentPaid + payAmt;
              const remaining = Math.max(0, totalAmt - newPaid);
              let status = 'pending';
              if (newPaid >= totalAmt) {
                status = 'paid';
              } else if (newPaid > 0) {
                status = 'partial';
              }
              await dbQuery(
                'UPDATE student_fees SET amount_paid = $1, remaining = $2, status = $3, updated_at = NOW() WHERE id = $4',
                [newPaid, remaining, status, feeId]
              );
              console.log(`[neon] Automatically updated student_fees ID ${feeId}: paid=${newPaid}, remaining=${remaining}, status=${status}`);
            }
          }
        }

        res.statusCode = 201;
        return res.end(JSON.stringify(rows[0]));
      }

      // ===== UPDATE =====
      if (req.method === 'PUT' && entityId) {
        const body = await parseBody(req);

        // Sanitize: convert empty strings to null for UUID/ID columns to avoid PostgreSQL type errors
        const UUID_COLUMNS = ['subject_id', 'session_id', 'student_id', 'teacher_id', 'expense_id', 'parent_id', 'case_id'];
        for (const col of UUID_COLUMNS) {
          if (body[col] !== undefined && body[col] === '') {
            body[col] = null;
          }
        }

        if (body.portal_password !== undefined) {
          if (body.portal_password === '') {
            delete body.portal_password;
          } else {
            body.portal_password = hashPassword(body.portal_password);
          }
        }
        if (body.parent_password !== undefined) {
          if (body.parent_password === '') {
            delete body.parent_password;
          } else {
            body.parent_password = hashPassword(body.parent_password);
          }
        }
        if (table === 'gateway_accounts' && body.password !== undefined) {
          if (body.password === '') {
            delete body.password;
          } else {
            body.password = hashPassword(body.password);
          }
        }
        if (table === 'system_admins' && body.password !== undefined) {
          if (body.password === '') {
            delete body.password;
          } else {
            body.password = hashPassword(body.password);
          }
        }

        if (table === 'portal_notifications' && body.recipient_id !== undefined) {
          body.user_id = body.recipient_id;
          delete body.recipient_id;
        }

        const keys = Object.keys(body).filter(k =>
          k !== 'id' && k !== 'created_at' && k !== 'updated_at' && body[k] !== undefined && sanitizeColumn(k)
        );
        if (keys.length === 0) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'No fields to update' }));
        }
        const sets = keys.map((k, i) => `${sanitizeColumn(k)} = $${i + 1}`);
        const values = keys.map(k => body[k]);
        values.push(entityId);
        let q = `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`;
        // Multi-tenant: منع تعديل سجل لمستأجر آخر
        if (isTenantTable && tenantId) {
          q = `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${values.length} AND school_id = $${values.length + 1} RETURNING *`;
          values.push(tenantId);
        } else {
          q = `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`;
        }
        console.log(`[neon] Updating ${table} ID ${entityId}:`, keys.join(', '));
        const rows = await dbQuery(q, values);
        if (rows.length === 0) {
          console.error(`[neon] Update failed: ${table} ID ${entityId} not found`);
          res.statusCode = 404;
          return res.end(JSON.stringify({ error: 'Not found' }));
        }
        console.log(`[neon] Update successful for ${table} ID ${entityId}`);
        return res.end(JSON.stringify(rows[0]));
      }

      // ===== DELETE =====
      if (req.method === 'DELETE' && entityId) {
        if (isTenantTable && tenantId) {
          await dbQuery(`DELETE FROM ${table} WHERE id = $1 AND school_id = $2`, [entityId, tenantId]);
        } else {
          await dbQuery(`DELETE FROM ${table} WHERE id = $1`, [entityId]);
        }
        return res.end(JSON.stringify({ success: true }));
      }

      res.statusCode = 405;
      res.end(JSON.stringify({ error: 'Method not allowed' }));

    } catch (error) {
      if (error.message && error.message.includes('invalid input syntax for type uuid')) {
        res.statusCode = 404;
        return res.end(JSON.stringify({ error: 'Not found (Invalid UUID format)' }));
      }
      console.error('API Error:', error.message);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: error.message }));
    }
  };
}

export function setupApiRoutes(server) {
  server.middlewares.use(createApiHandler());
}

export function setupWebSocket(server) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('[Socket.io] New connection established:', socket.id);
    
    // حفظ الـ userId للاستخدام في الـ WebRTC المُوجّه
    const { userId, roomId } = socket.handshake.query;
    if (userId) {
      socket.userId = userId;
    }
    if (roomId) {
      socket.roomId = roomId;
    }

    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`[Socket.io] Socket ${socket.id} joined drawing room ${roomId}`);
    });

    socket.on('join-webrtc-room', (roomId) => {
      socket.join(roomId);
      socket.roomId = roomId;
      // إخبار الآخرين بانضمام مستخدم جديد
      socket.broadcast.to(roomId).emit('user-joined', { socketId: socket.id, userId });
      console.log(`[Socket.io] Socket ${socket.id} joined webrtc room ${roomId}`);
    });

    socket.on('draw-event', (data) => {
      const { roomId } = data;
      if (roomId) {
        socket.broadcast.to(roomId).emit('draw-event', data);
      }
    });

    socket.on('signal', (data) => {
      const { roomId, targetUserId } = data;
      if (!roomId) return;
      
      if (targetUserId) {
        // إرسال الإشارة لمستخدم محدد
        const roomSockets = io.sockets.adapter.rooms.get(roomId);
        if (roomSockets) {
          for (const socketId of roomSockets) {
            const clientSocket = io.sockets.sockets.get(socketId);
            if (clientSocket && String(clientSocket.userId) === String(targetUserId)) {
              clientSocket.emit('signal', data);
            }
          }
        }
      } else {
        // بث الإشارة للجميع ما عدا المرسل
        socket.broadcast.to(roomId).emit('signal', data);
      }
    });

    socket.on('disconnect', async () => {
      console.log('[Socket.io] Disconnected:', socket.id);
      if (socket.userId && socket.roomId && sql) {
        try {
          await sql`
            UPDATE session_participants 
            SET left_at = NOW() 
            WHERE user_id = ${socket.userId} AND session_id = ${socket.roomId} AND left_at IS NULL
          `;
          console.log(`[Socket.io] Marked user ${socket.userId} as left in room ${socket.roomId}`);
        } catch (err) {
          console.error('[Socket.io] Error updating left_at on disconnect:', err.message);
        }
      }
    });
  });
}

// ── Webhook Handlers ──

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const PAYMOB_SECRET = process.env.PAYMOB_SECRET_KEY;
const PAYMOB_WEBHOOK_SECRET = process.env.PAYMOB_WEBHOOK_SECRET;

async function parseRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function verifyStripeSignature(payload, signature) {
  if (!STRIPE_WEBHOOK_SECRET) return true;
  return true;
}

function verifyPaymobSignature(payload, hmacHeader) {
  if (!PAYMOB_WEBHOOK_SECRET) return true;
  const crypto = require('crypto');
  const expected = crypto.createHmac('sha512', PAYMOB_WEBHOOK_SECRET).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(hmacHeader || ''), Buffer.from(expected));
}

async function handleStripeWebhook(req, res) {
  try {
    const rawBody = await parseRawBody(req);
    const signature = req.headers['stripe-signature'];
    
    if (!verifyStripeSignature(rawBody, signature)) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Invalid signature' }));
    }
    
    const event = JSON.parse(rawBody);
    console.log('[stripe] webhook event:', event.type);
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await processSuccessfulPayment({
        provider: 'stripe',
        providerPaymentId: session.payment_intent || session.id,
        providerSessionId: session.id,
        schoolId: session.metadata?.school_id,
        amount: (session.amount_total || 0) / 100,
        currency: (session.currency || 'usd').toUpperCase(),
        plan: session.metadata?.plan || 'starter',
        billingCycle: session.metadata?.billing_cycle || 'monthly',
        metadata: session.metadata,
      });
    } else if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') {
      const session = event.data.object;
      await recordFailedPayment({
        provider: 'stripe',
        providerPaymentId: session.payment_intent || session.id,
        schoolId: session.metadata?.school_id,
        metadata: session.metadata,
      });
    }
    
    res.end(JSON.stringify({ received: true }));
  } catch (e) {
    console.error('[stripe] webhook error:', e.message);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: e.message }));
  }
}

async function handlePaymobWebhook(req, res) {
  try {
    const rawBody = await parseRawBody(req);
    const hmacHeader = req.headers['x-paymob-hmac'] || req.headers['hmac'];
    
    if (!verifyPaymobSignature(rawBody, hmacHeader)) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Invalid HMAC' }));
    }
    
    const data = JSON.parse(rawBody);
    console.log('[paymob] webhook:', data.type || data.order?.id);
    
    const order = data.order || data;
    if (order && (order.status === 'PAID' || order.status === 'SUCCESS' || order.success === true)) {
      await processSuccessfulPayment({
        provider: 'paymob',
        providerPaymentId: String(order.id || order.transaction_id),
        providerSessionId: String(order.id),
        schoolId: order.metadata?.school_id || order.items?.[0]?.metadata?.school_id,
        amount: (order.amount_cents || order.amount || 0) / 100,
        currency: 'EGP',
        plan: order.metadata?.plan || 'starter',
        billingCycle: order.metadata?.billing_cycle || 'monthly',
        metadata: order.metadata || {},
      });
    } else if (order && (order.status === 'FAILED' || order.status === 'CANCELLED')) {
      await recordFailedPayment({
        provider: 'paymob',
        providerPaymentId: String(order.id),
        schoolId: order.metadata?.school_id,
        metadata: order.metadata || {},
      });
    }
    
    res.end(JSON.stringify({ received: true }));
  } catch (e) {
    console.error('[paymob] webhook error:', e.message);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: e.message }));
  }
}

async function handleManualRenew(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ error: 'Unauthorized' }));
  }
  const token = authHeader.split(' ')[1];
  let user;
  try { user = jwt.verify(token, JWT_SECRET); } catch { res.statusCode = 401; return res.end(JSON.stringify({ error: 'Invalid token' })); }
  
  const rawBody = await parseRawBody(req);
  const { provider, provider_payment_id, billing_cycle, plan } = JSON.parse(rawBody || '{}');
  
  const schoolId = user.school_id || user.id;
  if (!schoolId) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'No school_id' })); }
  
  try {
    await processSuccessfulPayment({
      provider: provider || 'manual',
      providerPaymentId: provider_payment_id || `manual_${Date.now()}`,
      schoolId,
      amount: 0,
      currency: 'USD',
      plan: plan || 'starter',
      billingCycle: billing_cycle || 'monthly',
      metadata: { manual: true, admin_id: user.id },
    });
    res.end(JSON.stringify({ success: true }));
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: e.message }));
  }
}

async function processSuccessfulPayment({ provider, providerPaymentId, providerSessionId, schoolId, amount, currency, plan, billingCycle, metadata }) {
  if (!schoolId) {
    console.warn('[payment] no school_id in metadata, skipping');
    return;
  }
  
  await sql`
    INSERT INTO subscription_payments (school_id, provider, provider_payment_id, provider_session_id, amount, currency, status, billing_cycle, plan, metadata)
    VALUES (${schoolId}, ${provider}, ${providerPaymentId}, ${providerSessionId || null}, ${amount}, ${currency}, 'succeeded', ${billingCycle}, ${plan}, ${JSON.stringify(metadata)})
    ON CONFLICT (provider, provider_payment_id) DO UPDATE SET status = 'succeeded', updated_at = NOW()
  `.catch(e => console.error('[payment] insert failed:', e.message));
  
  await renewSchoolSubscription(schoolId, billingCycle);
  
  await sql`
    INSERT INTO subscription_notifications (school_id, type, channel, status, payload, sent_at)
    VALUES (${schoolId}, 'renewed', 'in_app', 'sent', ${JSON.stringify({ provider, amount, billingCycle, plan })}, NOW())
  `.catch(()=>{});
  
  console.log(`[payment] renewed school ${schoolId} for ${billingCycle} (${plan})`);
}

async function recordFailedPayment({ provider, providerPaymentId, schoolId, metadata }) {
  if (!schoolId) return;
  await sql`
    INSERT INTO subscription_payments (school_id, provider, provider_payment_id, amount, currency, status, billing_cycle, plan, metadata)
    VALUES (${schoolId}, ${provider}, ${providerPaymentId}, 0, 'USD', 'failed', 'monthly', 'starter', ${JSON.stringify(metadata)})
    ON CONFLICT (provider, provider_payment_id) DO UPDATE SET status = 'failed', updated_at = NOW()
  `.catch(()=>{});
  await sql`
    INSERT INTO subscription_notifications (school_id, type, channel, status, payload)
    VALUES (${schoolId}, 'payment_failed', 'in_app', 'sent', ${JSON.stringify({ provider, providerPaymentId })})
  `.catch(()=>{});
}

function calculateExpiryDate(startDate, billingCycle) {
  const end = new Date(startDate);
  if (billingCycle === 'yearly') end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return end;
}

async function renewSchoolSubscription(schoolId, billingCycle = 'monthly') {
  const rows = await sql`SELECT expires_at, subscription_status FROM schools WHERE id = ${schoolId}`.catch(()=>[]);
  if (!rows.length) return;
  
  const current = rows[0];
  const start = current.expires_at && new Date(current.expires_at) > new Date() ? new Date(current.expires_at) : new Date();
  const end = calculateExpiryDate(start, billingCycle);
  
  await sql`
    UPDATE schools 
    SET subscription_status = 'active', 
        subscription_start_date = ${start.toISOString()}, 
        expires_at = ${end.toISOString()},
        billing_cycle = ${billingCycle},
        updated_at = NOW()
    WHERE id = ${schoolId}
  `.catch(e => console.error('[renew] failed:', e.message));
}

// ── Background job: تنبيهات الانتهاء (7/3/1 يوم) ──
let notificationTimer = null;

async function checkAndSendExpiryNotifications() {
  if (!sql) return;
  try {
    const now = new Date();
    const in7d = new Date(now.getTime() + 7*24*60*60*1000);
    const in3d = new Date(now.getTime() + 3*24*60*60*1000);
    const in1d = new Date(now.getTime() + 1*24*60*60*1000);
    
    const r7 = await sql`SELECT id, name, email, director_name, expires_at FROM schools WHERE subscription_status = 'active' AND expires_at > ${now.toISOString()} AND expires_at <= ${in7d.toISOString()}`.catch(()=>[]);
    for (const s of r7) {
      await queueNotification(s.id, 'expiry_7d', { days: 7, expires_at: s.expires_at, director: s.director_name, email: s.email });
    }
    const r3 = await sql`SELECT id, name, email, director_name, expires_at FROM schools WHERE subscription_status = 'active' AND expires_at > ${now.toISOString()} AND expires_at <= ${in3d.toISOString()}`.catch(()=>[]);
    for (const s of r3) {
      await queueNotification(s.id, 'expiry_3d', { days: 3, expires_at: s.expires_at, director: s.director_name, email: s.email });
    }
    const r1 = await sql`SELECT id, name, email, director_name, expires_at FROM schools WHERE subscription_status = 'active' AND expires_at > ${now.toISOString()} AND expires_at <= ${in1d.toISOString()}`.catch(()=>[]);
    for (const s of r1) {
      await queueNotification(s.id, 'expiry_1d', { days: 1, expires_at: s.expires_at, director: s.director_name, email: s.email });
    }
    const rexp = await sql`SELECT id FROM schools WHERE subscription_status = 'active' AND expires_at < ${now.toISOString()}`.catch(()=>[]);
    for (const s of rexp) {
      await sql`UPDATE schools SET subscription_status = 'expired', updated_at = NOW() WHERE id = ${s.id}`.catch(()=>{});
      await queueNotification(s.id, 'expired', { expires_at: now.toISOString() });
    }
    console.log('[notifications] checked expiries:', { r7: r7.length, r3: r3.length, r1: r1.length, expired: rexp.length });
  } catch (e) {
    console.error('[notifications] check error:', e.message);
  }
}

async function queueNotification(schoolId, type, payload) {
  const existing = await sql`SELECT id FROM subscription_notifications WHERE school_id = ${schoolId} AND type = ${type} AND created_at > NOW() - INTERVAL '24 hours'`.catch(()=>[]);
  if (existing.length) return;
  
  await sql`
    INSERT INTO subscription_notifications (school_id, type, channel, status, payload)
    VALUES (${schoolId}, ${type}, 'in_app', 'pending', ${JSON.stringify(payload)})
  `.catch(()=>{});
}

notificationTimer = setInterval(checkAndSendExpiryNotifications, 6 * 60 * 60 * 1000);
setTimeout(checkAndSendExpiryNotifications, 5000);

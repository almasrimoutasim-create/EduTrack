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
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL DEFAULT 'System Admin',
      created_by TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(async () => {
    console.log('[neon] system_admins table verified/created');
    // Add missing columns if they don't exist (migration)
    await sql`ALTER TABLE system_admins ADD COLUMN IF NOT EXISTS username TEXT`.catch(()=>{});
    await sql`ALTER TABLE system_admins ADD COLUMN IF NOT EXISTS school_id UUID`.catch(()=>{});
    await sql`ALTER TABLE system_admins ADD COLUMN IF NOT EXISTS portal_password TEXT`.catch(()=>{});
    await sql`ALTER TABLE system_admins ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin'`.catch(()=>{});
    await sql`ALTER TABLE system_admins ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`.catch(()=>{});
    await sql`ALTER TABLE system_admins ADD COLUMN IF NOT EXISTS portal_username TEXT`.catch(()=>{});
    console.log('[neon] system_admins columns migrated');
    // Remove UNIQUE constraint on email if it exists (multiple schools may share admin email)
    await sql`ALTER TABLE system_admins DROP CONSTRAINT IF EXISTS system_admins_email_key`.catch(()=>{});
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
    sql`ALTER TABLE registration_requests ADD COLUMN IF NOT EXISTS billing_cycle TEXT;`.catch(()=>{});
    sql`ALTER TABLE registration_requests ADD COLUMN IF NOT EXISTS subjects TEXT;`.catch(()=>{});
    sql`ALTER TABLE registration_requests ADD COLUMN IF NOT EXISTS experience_years TEXT;`.catch(()=>{});
    sql`ALTER TABLE registration_requests ADD COLUMN IF NOT EXISTS bio TEXT;`.catch(()=>{});
    sql`ALTER TABLE registration_requests ADD COLUMN IF NOT EXISTS grade TEXT;`.catch(()=>{});
    sql`ALTER TABLE registration_requests ADD COLUMN IF NOT EXISTS notes TEXT;`.catch(()=>{});
  }).catch(err => {
    console.error('[neon] failed to verify/create registration_requests table:', err.message);
  });

  // ── Independent Teacher Portal: جدول المعلمين المستقلين ──
  sql`
    CREATE TABLE IF NOT EXISTS teachers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name TEXT NOT NULL,
      email TEXT,
      employee_id TEXT,
      phone TEXT,
      subjects TEXT,
      experience_years INTEGER,
      bio TEXT,
      status TEXT DEFAULT 'active',
      portal_password TEXT,
      school_id UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(() => console.log('[neon] teachers table verified'))
    .catch(err => console.error('[neon] teachers:', err.message));

  // Migration: add experience_years if missing
  sql`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS experience_years INTEGER;`.catch(() => {});

  // ── Independent Student Portal: جدول الطلاب المستقلين ──
  sql`
    CREATE TABLE IF NOT EXISTS students (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name TEXT NOT NULL,
      user_email TEXT,
      student_id TEXT,
      phone TEXT,
      grade TEXT,
      parent_name TEXT,
      parent_phone TEXT,
      parent_email TEXT,
      school_name TEXT,
      city TEXT,
      status TEXT DEFAULT 'active',
      portal_password TEXT,
      school_id UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(() => console.log('[neon] students table verified'))
    .catch(err => console.error('[neon] students:', err.message));

  // ── Multi-tenant: إضافة school_id لكل جدول مستأجر + فهرسة + RLS سيتم لاحقاً ──
  const TENANT_TABLES = [
    'students','teachers','attendance','subjects','library_books','financial_records',
    'activity_posts','activity_comments','activity_chats','audit_logs','bus_drivers','bus_driver_reports','card_top_ups','class_schedules','donations','friend_requests','store_items','purchases','study_rooms','study_groups','study_group_posts','study_materials','student_awards','student_grades','student_reports','supervisors','staff_members','teacher_ratings','teacher_tasks','portal_access_configs','portal_groups','portal_group_messages','portal_notifications','private_messages','room_messages','room_videos','book_reviews','message_read_receipts','typing_indicators','fines','parent_link_requests','virtual_sessions','session_participants','official_announcements','counseling_cases','case_assessments','intervention_plans','follow_ups','case_visibility_logs','fee_structures','student_fees','fee_payments','activity_fees','student_activity_fees','student_wallet','wallet_transactions','hall_rentals','other_revenue','expenses','salary_records','purchase_orders','visitors','system_settings','system_admins',
    'teacher_own_students','teacher_assignments','teacher_exams','teacher_submissions','teacher_live_classes','class_participants','teacher_youtube_videos','teacher_subscriptions','curriculum_books'
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
      await sql.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS slug TEXT`).catch(()=>{});
      await sql.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS domain_subdomain TEXT`).catch(()=>{});
      await sql.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS logo_url TEXT`).catch(()=>{});
      await sql.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS background_image TEXT`).catch(()=>{});
      await sql.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS gateway_username TEXT`).catch(()=>{});
      await sql.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS gateway_password TEXT`).catch(()=>{});
      await sql.query(`CREATE INDEX IF NOT EXISTS idx_schools_slug ON schools(slug)`).catch(()=>{});
      // ترحيل الـ slug للمدارس الموجودة
      await sql.query(`UPDATE schools SET slug = 'main-school' WHERE (slug IS NULL OR slug = '') AND (name LIKE '%عباد الرحمن%' OR name_ar LIKE '%عباد الرحمن%')`).catch(()=>{});
      await sql.query(`UPDATE schools SET slug = 'school-' || SUBSTRING(id::text, 1, 8) WHERE slug IS NULL OR slug = ''`).catch(()=>{});
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

  // Auto-create teacher_subscription_requests table
  sql`
    CREATE TABLE IF NOT EXISTS teacher_subscription_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      teacher_name TEXT NOT NULL,
      teacher_email TEXT NOT NULL,
      teacher_phone TEXT,
      plan_type TEXT NOT NULL DEFAULT 'monthly',
      amount NUMERIC DEFAULT 0,
      receipt_url TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      founder_notes TEXT,
      school_id UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(async () => {
    console.log('[neon] teacher_subscription_requests table verified/created');
    // Migration: add trial and approval columns
    await sql`ALTER TABLE teacher_subscription_requests ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP WITH TIME ZONE`.catch(()=>{});
    await sql`ALTER TABLE teacher_subscription_requests ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE`.catch(()=>{});
    await sql`ALTER TABLE teacher_subscription_requests ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE`.catch(()=>{});
    await sql`ALTER TABLE teacher_subscription_requests ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE`.catch(()=>{});
    await sql`ALTER TABLE teacher_subscription_requests ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE`.catch(()=>{});
    console.log('[neon] teacher_subscription_requests columns migrated');
  }).catch(err => console.error('[neon] teacher_subscription_requests:', err.message));

  // Auto-create student_teacher_bonds table
  sql`
    CREATE TABLE IF NOT EXISTS student_teacher_bonds (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL,
      student_name TEXT NOT NULL,
      student_email TEXT,
      teacher_id UUID NOT NULL,
      teacher_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      request_message TEXT,
      receipt_url TEXT,
      portal_username TEXT,
      portal_password TEXT,
      school_id UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(() => console.log('[neon] student_teacher_bonds table verified/created'))
    .catch(err => console.error('[neon] student_teacher_bonds:', err.message));

  // Auto-create subscription_pricing table
  sql`
    CREATE TABLE IF NOT EXISTS subscription_pricing (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      plan_name TEXT NOT NULL,
      plan_name_ar TEXT,
      plan_type TEXT NOT NULL DEFAULT 'teacher',
      price_monthly NUMERIC DEFAULT 0,
      price_yearly NUMERIC DEFAULT 0,
      currency TEXT DEFAULT 'EGP',
      trial_days INTEGER DEFAULT 30,
      features JSONB DEFAULT '[]',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `.then(async () => {
    console.log('[neon] subscription_pricing table verified/created');
    // Seed default teacher pricing if empty
    const rows = await sql`SELECT COUNT(*) FROM subscription_pricing`;
    if (rows[0].count === '0') {
      await sql`INSERT INTO subscription_pricing (plan_name, plan_name_ar, plan_type, price_monthly, price_yearly, currency, trial_days, features) VALUES
        ('teacher_monthly', 'اشتراك شهري للمعلم', 'teacher', 49000, 0, 'EGP', 30, '[" إدارة طلاب غير محدودة", "واجبات وامتحانات", "بث مباشر", "فيديوهات يوتيوب"]'),
        ('teacher_yearly', 'اشتراك سنوي للمعلم', 'teacher', 0, 350000, 'EGP', 30, '[" إدارة طلاب غير محدودة", "واجبات وامتحانات", "بث مباشر", "فيديوهات يوتيوب", "خصم 41%"]')
      `;
      console.log('[neon] seeded default teacher pricing plans');
    }
  }).catch(err => console.error('[neon] subscription_pricing:', err.message));

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
    console.error('[neon] CRITICAL: DATABASE_URL is not configured. All DB queries return empty. Set DATABASE_URL in Render dashboard env vars.');
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

    // Update school branding (logo_url, background_image) from admin Settings page
    if ((req.url === '/neon-db/update-school-branding' || req.url === '/api/update-school-branding') && req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json');
      try {
        if (!sql) {
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: 'Database not configured' }));
        }
        const body = await parseBody(req);
        const { school_id, logo_url, background_image } = body;
        if (!school_id) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'school_id is required' }));
        }
        await sql`UPDATE schools SET logo_url = ${logo_url || ''}, background_image = ${background_image || ''} WHERE id = ${school_id}`;
        return res.end(JSON.stringify({ success: true }));
      } catch (e) {
        console.error('[update-school-branding]', e);
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: e.message }));
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

    // Intercept School Public Info by Slug (No Auth)
    if ((req.url.startsWith('/neon-db/public-school/') || req.url.startsWith('/api/public-school/')) && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      try {
        const rawSlug = req.url.replace(/^\/(neon-db|api)\/public-school\//, '').split('?')[0];
        const slug = decodeURIComponent(rawSlug).trim();
        if (!slug) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'Slug is required' }));
        }

        const rows = await dbQuery(
          `SELECT id, name, name_ar, name_en, logo_url, background_image, country, plan, subscription_status, slug, domain_subdomain, expires_at 
           FROM schools 
           WHERE (slug = $1 OR domain_subdomain = $1 OR id::text = $1)
           LIMIT 1`,
          [slug]
        );

        if (rows.length === 0) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ error: 'المدرسة غير مسجلة أو الرابط غير صحيح' }));
        }

        const s = rows[0];
        return res.end(JSON.stringify({
          success: true,
          school: {
            id: s.id,
            name: s.name_ar || s.name || s.name_en,
            name_ar: s.name_ar || s.name,
            name_en: s.name_en || s.name,
            slug: s.slug || s.domain_subdomain || s.id,
            logo_url: s.logo_url || '',
            background_image: s.background_image || '',
            country: s.country || 'السودان',
            subscription_status: s.subscription_status || 'active',
            plan: s.plan || 'professional',
            expires_at: s.expires_at
          }
        }));
      } catch (e) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: e.message }));
      }
    }

    // Intercept Dedicated School Gateway login endpoint
    if ((req.url === '/neon-db/auth/school-gateway' || req.url === '/api/auth/school-gateway') && req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json');
      try {
        const body = await parseBody(req);
        const { slug, username, password } = body;
        if (!slug || !username || !password) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'المدرسة واسم المستخدم وكلمة المرور مطلوبة' }));
        }

        const schoolRows = await dbQuery(
          `SELECT * FROM schools WHERE (slug = $1 OR domain_subdomain = $1 OR id::text = $1) LIMIT 1`,
          [slug.trim()]
        );
        if (schoolRows.length === 0) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ error: 'المدرسة غير موجودة أو الرابط غير صالح' }));
        }
        const school = schoolRows[0];

        if (school.subscription_status === 'inactive' || school.subscription_status === 'expired') {
          res.statusCode = 403;
          return res.end(JSON.stringify({ error: 'اشتراك هذه المدرسة معلق أو منتهي الصلاحية. يرجى التواصل مع إدارة منصة EduTrack.' }));
        }

        // 1. Check system_admins for this school
        const adminRows = await dbQuery(
          `SELECT * FROM system_admins WHERE school_id = $1 AND (LOWER(email) = LOWER($2) OR LOWER(username) = LOWER($2) OR LOWER(full_name) = LOWER($2)) LIMIT 1`,
          [school.id, username.trim()]
        );

        let authenticatedAdmin = null;
        if (adminRows.length > 0) {
          const adminRow = adminRows[0];
          if (adminRow.password && bcrypt.compareSync(password, adminRow.password)) {
            authenticatedAdmin = adminRow;
          } else if (adminRow.portal_password && (adminRow.portal_password === password || bcrypt.compareSync(password, adminRow.portal_password))) {
            authenticatedAdmin = adminRow;
          }
        }

        // 2. Check if username matches school email or director
        if (!authenticatedAdmin && school.email && school.email.toLowerCase() === username.trim().toLowerCase()) {
          const anyAdmin = await dbQuery(`SELECT * FROM system_admins WHERE school_id = $1 LIMIT 1`, [school.id]);
          if (anyAdmin.length > 0 && anyAdmin[0].password && bcrypt.compareSync(password, anyAdmin[0].password)) {
            authenticatedAdmin = anyAdmin[0];
          }
        }

        // 3. Fallback: Check gateway_accounts if any
        if (!authenticatedAdmin) {
          const gwRows = await dbQuery('SELECT * FROM gateway_accounts WHERE username = $1', [username.trim()]);
          if (gwRows.length > 0 && bcrypt.compareSync(password, gwRows[0].password)) {
            authenticatedAdmin = {
              id: 'gw-' + school.id,
              full_name: school.director_name || school.name,
              email: school.email || username.trim(),
              role: 'admin',
              school_id: school.id
            };
          }
        }

        if (!authenticatedAdmin) {
          res.statusCode = 401;
          return res.end(JSON.stringify({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة لهذه المدرسة' }));
        }

        const user = {
          id: authenticatedAdmin.id,
          full_name: authenticatedAdmin.full_name || school.director_name || school.name,
          email: authenticatedAdmin.email || school.email,
          role: 'admin',
          school_id: school.id,
          school_name: school.name_ar || school.name
        };

        const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });

        return res.end(JSON.stringify({
          success: true,
          user,
          token,
          school: {
            id: school.id,
            name: school.name_ar || school.name,
            slug: school.slug || school.domain_subdomain || school.id,
            plan: school.plan
          }
        }));
      } catch (error) {
        console.error('[school-gateway] error:', error);
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: error.message }));
      }
    }

    // Intercept Gateway login endpoint (legacy / fallback)
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

    // ── Approve Student Endpoint (Founder action) ──
    if ((req.url === '/api/approve-student' || req.url === '/neon-db/approve-student') && req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json');
      try {
        const body = await parseBody(req);
        const { requestId, username, password, school_id } = body;
        if (!requestId || !username || !password) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'requestId, username, and password are required' }));
        }

        const reqRows = await dbQuery('SELECT * FROM registration_requests WHERE id = $1', [requestId]);
        if (reqRows.length === 0) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ error: 'Request not found' }));
        }
        const reg = reqRows[0];

        const hashedPassword = hashPassword(password);
        const studentId = `STU-${Date.now().toString().slice(-6)}`;

        // Check if student already exists with this user_email
        const existing = await dbQuery('SELECT id FROM students WHERE user_email = $1', [username.trim().toLowerCase()]);
        if (existing.length > 0) {
          await dbQuery(
            `UPDATE students 
             SET full_name = $1, phone = $2, grade = $3, parent_name = $4, parent_phone = $5, parent_email = $6, school_name = $7, city = $8, portal_password = $9, status = 'active', school_id = COALESCE($11, school_id)
             WHERE user_email = $10`,
            [
              reg.full_name || 'طالب',
              reg.phone || null,
              reg.grade || null,
              reg.director_name || null,
              reg.phone || null,
              reg.email || null,
              reg.school_name || null,
              reg.country || null,
              hashedPassword,
              username.trim().toLowerCase(),
              school_id || null
            ]
          );
        } else {
          await dbQuery(
            `INSERT INTO students (full_name, user_email, student_id, phone, grade, parent_name, parent_phone, parent_email, school_name, city, status, portal_password, school_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', $11, $12)`,
            [
              reg.full_name || 'طالب جديد',
              username.trim().toLowerCase(),
              studentId,
              reg.phone || null,
              reg.grade || null,
              reg.director_name || null,
              reg.phone || null,
              reg.email || null,
              reg.school_name || null,
              reg.country || null,
              hashedPassword,
              school_id || null
            ]
          );
        }

        // Update registration request
        await dbQuery(
          `UPDATE registration_requests 
           SET status = 'approved', username_generated = $1, reviewed_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [username.trim(), requestId]
        );

        return res.end(JSON.stringify({ success: true, message: 'Student approved successfully', studentId }));
      } catch (error) {
        console.error('[approve-student] error:', error);
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: error.message }));
      }
    }

    // ── Approve Teacher Endpoint (Founder action) ──
    if ((req.url === '/api/approve-teacher' || req.url === '/neon-db/approve-teacher') && req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json');
      try {
        const body = await parseBody(req);
        const { requestId, username, password, school_id } = body;
        if (!requestId || !username || !password) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'requestId, username, and password are required' }));
        }

        const reqRows = await dbQuery('SELECT * FROM registration_requests WHERE id = $1', [requestId]);
        if (reqRows.length === 0) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ error: 'Request not found' }));
        }
        const reg = reqRows[0];

        const hashedPassword = hashPassword(password);
        const empId = `TCH-${Date.now().toString().slice(-6)}`;

        const existing = await dbQuery('SELECT id FROM teachers WHERE email = $1', [username.trim().toLowerCase()]);
        if (existing.length > 0) {
          await dbQuery(
            `UPDATE teachers 
             SET full_name = $1, phone = $2, subjects = $3, experience_years = $4, bio = $5, portal_password = $6, status = 'active', school_id = COALESCE($8, school_id)
             WHERE email = $7`,
            [
              reg.full_name || 'معلم',
              reg.phone || null,
              reg.subjects || null,
              parseInt(reg.experience_years) || null,
              reg.bio || null,
              hashedPassword,
              username.trim().toLowerCase(),
              school_id || null
            ]
          );
        } else {
          await dbQuery(
            `INSERT INTO teachers (full_name, email, employee_id, phone, subjects, experience_years, bio, status, portal_password, school_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $9)`,
            [
              reg.full_name || 'معلم جديد',
              username.trim().toLowerCase(),
              empId,
              reg.phone || null,
              reg.subjects || null,
              parseInt(reg.experience_years) || null,
              reg.bio || null,
              hashedPassword,
              school_id || null
            ]
          );
        }

        // Update registration request
        await dbQuery(
          `UPDATE registration_requests 
           SET status = 'approved', username_generated = $1, reviewed_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [username.trim(), requestId]
        );

        return res.end(JSON.stringify({ success: true, message: 'Teacher approved successfully', empId }));
      } catch (error) {
        console.error('[approve-teacher] error:', error);
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: error.message }));
      }
    }

    // ── Teacher Subscription Request ──
    if (req.url === '/api/teacher-subscription-request' && req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json');
      try {
        const body = await parseBody(req);
        const { teacherName, teacherEmail, teacherPhone, planType, amount, receiptFile, receiptName } = body;
        if (!teacherName || !teacherEmail) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'teacherName and teacherEmail are required' }));
        }

        let receiptUrl = null;
        if (receiptFile) {
          const fs = await import('fs');
          const pathMod = await import('path');
          const uploadDir = pathMod.join(process.cwd(), 'public', 'uploads');
          if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
          const buffer = Buffer.from(receiptFile, 'base64');
          const safeName = `${Date.now()}_${(receiptName || 'receipt').replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
          const filePath = pathMod.join(uploadDir, safeName);
          fs.writeFileSync(filePath, buffer);
          receiptUrl = `/uploads/${safeName}`;
        }

        const result = await dbQuery(
          `INSERT INTO teacher_subscription_requests (teacher_name, teacher_email, teacher_phone, plan_type, amount, receipt_url)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [teacherName, teacherEmail, teacherPhone || null, planType || 'monthly', amount || 0, receiptUrl]
        );
        return res.end(JSON.stringify({ success: true, id: result[0].id }));
      } catch (error) {
        console.error('[teacher-subscription-request] error:', error);
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: error.message }));
      }
    }

    // ── Student Bond Request ──
    if (req.url === '/api/student-bond-request' && req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json');
      try {
        const body = await parseBody(req);
        const { studentId, studentName, studentEmail, teacherId, teacherName, requestMessage, receiptFile, receiptName } = body;
        if (!studentId || !studentName || !teacherId || !teacherName) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'studentId, studentName, teacherId, and teacherName are required' }));
        }

        let receiptUrl = null;
        if (receiptFile) {
          const fs = await import('fs');
          const pathMod = await import('path');
          const uploadDir = pathMod.join(process.cwd(), 'public', 'uploads');
          if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
          const buffer = Buffer.from(receiptFile, 'base64');
          const safeName = `${Date.now()}_${(receiptName || 'receipt').replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
          const filePath = pathMod.join(uploadDir, safeName);
          fs.writeFileSync(filePath, buffer);
          receiptUrl = `/uploads/${safeName}`;
        }

        const result = await dbQuery(
          `INSERT INTO student_teacher_bonds (student_id, student_name, student_email, teacher_id, teacher_name, status, request_message, receipt_url)
           VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7) RETURNING id`,
          [studentId, studentName, studentEmail || null, teacherId, teacherName, requestMessage || null, receiptUrl]
        );
        return res.end(JSON.stringify({ success: true, id: result[0].id }));
      } catch (error) {
        console.error('[student-bond-request] error:', error);
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: error.message }));
      }
    }

    // ── Teacher Bond Approve ──
    if (req.url === '/api/teacher-bond-approve' && req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json');
      try {
        const body = await parseBody(req);
        const { bondId, portalUsername, portalPassword } = body;
        if (!bondId) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'bondId is required' }));
        }

        const hashedPw = hashPassword(portalPassword);
        await dbQuery(
          `UPDATE student_teacher_bonds SET status = 'approved', portal_username = $1, portal_password = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
          [portalUsername || null, hashedPw, bondId]
        );
        return res.end(JSON.stringify({ success: true }));
      } catch (error) {
        console.error('[teacher-bond-approve] error:', error);
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: error.message }));
      }
    }

    // ── Teacher Bond Reject ──
    if (req.url === '/api/teacher-bond-reject' && req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json');
      try {
        const body = await parseBody(req);
        const { bondId, reason } = body;
        if (!bondId) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'bondId is required' }));
        }

        await dbQuery(
          `UPDATE student_teacher_bonds SET status = 'rejected', founder_notes = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [reason || null, bondId]
        );
        return res.end(JSON.stringify({ success: true }));
      } catch (error) {
        console.error('[teacher-bond-reject] error:', error);
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: error.message }));
      }
    }

    // ── Get Teacher Bonds ──
    if (req.url.startsWith('/api/teacher-bonds') && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      try {
        const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const teacherId = urlObj.searchParams.get('teacherId');
        if (!teacherId) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'teacherId query parameter is required' }));
        }

        const bonds = await dbQuery(
          `SELECT * FROM student_teacher_bonds WHERE teacher_id = $1 ORDER BY created_at DESC`,
          [teacherId]
        );
        return res.end(JSON.stringify({ success: true, bonds }));
      } catch (error) {
        console.error('[teacher-bonds] error:', error);
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: error.message }));
      }
    }

    // ── Get Teacher Subscription Requests ──
    if (req.url === '/api/teacher-subscription-requests' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      try {
        const requests = await dbQuery(
          `SELECT * FROM teacher_subscription_requests ORDER BY created_at DESC`
        );
        return res.end(JSON.stringify({ success: true, requests }));
      } catch (error) {
        console.error('[teacher-subscription-requests] error:', error);
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: error.message }));
      }
    }

    // ── API routes for payment (require auth) ──
    if (req.url.startsWith('/api/')) {
      res.setHeader('Content-Type', 'application/json');
      
      // Verify JWT for API routes
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.statusCode = 401;
        return res.end(JSON.stringify({ error: 'Unauthorized' }));
      }
      const token = authHeader.split(' ')[1];
      let user;
      try { user = jwt.verify(token, JWT_SECRET); } catch { res.statusCode = 401; return res.end(JSON.stringify({ error: 'Invalid token' })); }
      req.user = user;

      if (req.url === '/api/create-checkout-session' && req.method === 'POST') {
        return handleCreateCheckoutSession(req, res, user);
      }
      
      res.statusCode = 404;
      return res.end(JSON.stringify({ error: 'API not found' }));
    }

    if (!req.url.startsWith('/neon-db/entities/')) return next();

    // DEBUG: Log all RegistrationRequest traffic to trace browser submissions
    if (req.url.includes('RegistrationRequest')) {
      console.log(`[DEBUG-REG] ${req.method} ${req.url} | origin=${req.headers.origin} | x-founder-auth=${req.headers['x-founder-auth']} | content-type=${req.headers['content-type']}`);
    }

    res.setHeader('Content-Type', 'application/json');

    // Parse entity early to allow public registration + founder cross-tenant operations
    const earlyUrlParts = req.url.split('?');
    const earlyPath = earlyUrlParts[0];
    const earlyMatch = earlyPath.match(/^\/neon-db\/entities\/([^\/]+)(?:\/(.+))?$/);
    const earlyEntity = earlyMatch ? earlyMatch[1] : null;
    const isPublicRegistrationPost = earlyEntity === 'RegistrationRequest' && req.method === 'POST';
    const isFounderAuth = req.headers['x-founder-auth'] === 'true';
    const isFounderEntity = earlyEntity === 'School' || earlyEntity === 'RegistrationRequest' || earlyEntity === 'SystemAdmin' || earlyEntity === 'Teacher' || earlyEntity === 'Student';
    const isFounderPublicRead = isFounderEntity && req.method === 'GET';
    const isFounderEntityAction = isFounderAuth && isFounderEntity;
    const authHeader = req.headers.authorization;
    // Founder (سواء بـ header خاص أو عام) يسمح له بالوصول للطلبات والمدارس
    const allowWithoutAuth = isPublicRegistrationPost || isFounderPublicRead || isFounderEntityAction;

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

      // ===== Independent Teacher Portal Tables =====
      sql`
        CREATE TABLE IF NOT EXISTS teacher_own_students (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          teacher_id UUID NOT NULL,
          school_id UUID,
          student_name TEXT NOT NULL,
          student_email TEXT,
          student_phone TEXT,
          grade TEXT,
          parent_name TEXT,
          parent_phone TEXT,
          parent_email TEXT,
          status TEXT DEFAULT 'active',
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `.then(() => console.log('[neon] teacher_own_students table verified'))
        .catch(err => console.error('[neon] teacher_own_students:', err.message));

      sql`
        CREATE TABLE IF NOT EXISTS teacher_assignments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          teacher_id UUID NOT NULL,
          school_id UUID,
          title TEXT NOT NULL,
          description TEXT,
          subject TEXT,
          grade TEXT,
          due_date TIMESTAMP WITH TIME ZONE,
          total_points INTEGER DEFAULT 100,
          attachment_url TEXT,
          status TEXT DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `.then(() => console.log('[neon] teacher_assignments table verified'))
        .catch(err => console.error('[neon] teacher_assignments:', err.message));

      sql`
        CREATE TABLE IF NOT EXISTS teacher_exams (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          teacher_id UUID NOT NULL,
          school_id UUID,
          title TEXT NOT NULL,
          description TEXT,
          subject TEXT,
          grade TEXT,
          duration_minutes INTEGER DEFAULT 60,
          total_points INTEGER DEFAULT 100,
          questions JSONB DEFAULT '[]',
          due_date TIMESTAMP WITH TIME ZONE,
          status TEXT DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `.then(() => console.log('[neon] teacher_exams table verified'))
        .catch(err => console.error('[neon] teacher_exams:', err.message));

      sql`
        CREATE TABLE IF NOT EXISTS teacher_submissions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          teacher_id UUID NOT NULL,
          assignment_id UUID,
          exam_id UUID,
          student_id UUID,
          student_name TEXT,
          school_id UUID,
          answers JSONB DEFAULT '{}',
          score NUMERIC,
          feedback TEXT,
          status TEXT DEFAULT 'submitted',
          submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          graded_at TIMESTAMP WITH TIME ZONE
        )
      `.then(() => console.log('[neon] teacher_submissions table verified'))
        .catch(err => console.error('[neon] teacher_submissions:', err.message));

      sql`
        CREATE TABLE IF NOT EXISTS teacher_live_classes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          teacher_id UUID NOT NULL,
          school_id UUID,
          title TEXT NOT NULL,
          description TEXT,
          subject TEXT,
          grade TEXT,
          scheduled_at TIMESTAMP WITH TIME ZONE,
          duration_minutes INTEGER DEFAULT 60,
          room_token TEXT,
          room_url TEXT,
          status TEXT DEFAULT 'scheduled',
          max_students INTEGER DEFAULT 30,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `.then(() => console.log('[neon] teacher_live_classes table verified'))
        .catch(err => console.error('[neon] teacher_live_classes:', err.message));

      sql`
        CREATE TABLE IF NOT EXISTS class_participants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          class_id UUID NOT NULL,
          student_id UUID,
          student_name TEXT,
          school_id UUID,
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          left_at TIMESTAMP WITH TIME ZONE
        )
      `.then(() => console.log('[neon] class_participants table verified'))
        .catch(err => console.error('[neon] class_participants:', err.message));

      sql`
        CREATE TABLE IF NOT EXISTS teacher_youtube_videos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          teacher_id UUID NOT NULL,
          school_id UUID,
          title TEXT NOT NULL,
          description TEXT,
          youtube_url TEXT NOT NULL,
          thumbnail_url TEXT,
          subject TEXT,
          grade TEXT,
          is_hidden BOOLEAN DEFAULT FALSE,
          order_index INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `.then(() => console.log('[neon] teacher_youtube_videos table verified'))
        .catch(err => console.error('[neon] teacher_youtube_videos:', err.message));

      sql`
        CREATE TABLE IF NOT EXISTS teacher_subscriptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          teacher_id UUID NOT NULL,
          student_id UUID NOT NULL,
          student_name TEXT,
          student_email TEXT,
          school_id UUID,
          plan TEXT DEFAULT 'monthly',
          amount NUMERIC DEFAULT 0,
          status TEXT DEFAULT 'pending',
          payment_method TEXT,
          started_at TIMESTAMP WITH TIME ZONE,
          expires_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `.then(() => console.log('[neon] teacher_subscriptions table verified'))
        .catch(err => console.error('[neon] teacher_subscriptions:', err.message));

      sql`
        CREATE TABLE IF NOT EXISTS curriculum_books (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          title_ar TEXT,
          subject TEXT NOT NULL,
          grade TEXT NOT NULL,
          author TEXT,
          publisher TEXT,
          year TEXT,
          cover_url TEXT,
          file_url TEXT,
          description TEXT,
          description_ar TEXT,
          is_public BOOLEAN DEFAULT TRUE,
          school_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `.then(() => console.log('[neon] curriculum_books table verified'))
        .catch(err => console.error('[neon] curriculum_books:', err.message));

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
        if (!rows) {
          console.error(`[neon] SELECT from ${table} returned null — DATABASE_URL may be missing`);
          return res.end(JSON.stringify([]));
        }
        if (table === 'registration_requests') {
          console.log(`[DEBUG-REG] LIST OK: ${rows.length} rows returned`);
        }
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
        // Multi-tenant: حقن school_id تلقائياً (الأولوية لـ req.user school_id)
        const tenantIdFromUser = req.user?.school_id;
        if (isTenantTable && tenantIdFromUser && !body.school_id) {
          body.school_id = tenantIdFromUser;
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

        if (!rows || rows.length === 0) {
          console.error(`[neon] INSERT into ${table} returned no rows — DATABASE_URL may be missing or query failed`);
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: 'Database not configured or INSERT failed. Check DATABASE_URL in Render env vars.' }));
        }

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
        if (table === 'registration_requests') {
          console.log(`[DEBUG-REG] INSERT OK: id=${rows[0].id} email=${rows[0].email} school=${rows[0].school_name} plan=${rows[0].plan}`);
        }
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

      // ── POST /api/approve-teacher — الموافقة على تسجيل معلم + إنشاء حساب ──
      if (req.url === '/api/approve-teacher' && req.method === 'POST') {
        res.setHeader('Content-Type', 'application/json');
        try {
          const body = await parseBody(req);
          const { requestId, username, password } = body;
          if (!requestId || !username || !password) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'requestId, username, and password are required' }));
          }

          // Fetch the registration request
          const reqRows = await dbQuery(
            `SELECT * FROM registration_requests WHERE id = $1 AND role_requested = 'teacher' AND status = 'pending'`,
            [requestId]
          );
          if (reqRows.length === 0) {
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: 'Registration request not found or already processed' }));
          }
          const reg = reqRows[0];

          // Check username uniqueness
          const existingTeacher = await dbQuery(
            `SELECT id FROM teachers WHERE email = $1 OR employee_id = $1`,
            [username]
          );
          if (existingTeacher.length > 0) {
            res.statusCode = 409;
            return res.end(JSON.stringify({ error: 'Username already exists — choose a different one' }));
          }

          // Create teacher account in teachers table
          const teacherId = crypto.randomUUID();
          const hashedPassword = hashPassword(password);
          const subjects = Array.isArray(reg.subjects) ? reg.subjects.join(', ') : (reg.subjects || '');

          await dbQuery(
            `INSERT INTO teachers (id, full_name, email, employee_id, subjects, status, portal_password, school_id, created_at)
             VALUES ($1, $2, $3, $4, $5, 'active', $6, NULL, NOW())`,
            [teacherId, reg.full_name, reg.email, username, subjects, hashedPassword]
          );

          // Mark registration request as accepted
          await dbQuery(
            `UPDATE registration_requests SET status = 'accepted', reviewed_at = NOW() WHERE id = $1`,
            [requestId]
          );

          return res.end(JSON.stringify({
            success: true,
            teacherId,
            message: 'Teacher account created — credentials ready for login'
          }));
        } catch (error) {
          console.error('[approve-teacher] error:', error);
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: error.message }));
        }
      }

      // ── POST /api/approve-student — الموافقة على تسجيل طالب + إنشاء حساب ──
      if (req.url === '/api/approve-student' && req.method === 'POST') {
        res.setHeader('Content-Type', 'application/json');
        try {
          const body = await parseBody(req);
          const { requestId, username, password } = body;
          if (!requestId || !username || !password) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'requestId, username, and password are required' }));
          }

          const reqRows = await dbQuery(
            `SELECT * FROM registration_requests WHERE id = $1 AND role_requested = 'student' AND status = 'pending'`,
            [requestId]
          );
          if (reqRows.length === 0) {
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: 'Registration request not found or already processed' }));
          }
          const reg = reqRows[0];

          const existingStudent = await dbQuery(
            `SELECT id FROM students WHERE user_email = $1 OR student_id = $1`,
            [username]
          );
          if (existingStudent.length > 0) {
            res.statusCode = 409;
            return res.end(JSON.stringify({ error: 'Username already exists — choose a different one' }));
          }

          const studentId = crypto.randomUUID();
          const hashedPassword = hashPassword(password);

          await dbQuery(
            `INSERT INTO students (id, full_name, user_email, student_id, phone, grade, parent_name, parent_phone, parent_email, school_name, city, status, portal_password, school_id, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active', $12, NULL, NOW())`,
            [studentId, reg.full_name, reg.email, username, reg.phone, reg.grade || null, reg.director_name || null, null, reg.email, reg.school_name || null, reg.country || null, hashedPassword]
          );

          await dbQuery(
            `UPDATE registration_requests SET status = 'accepted', reviewed_at = NOW() WHERE id = $1`,
            [requestId]
          );

          return res.end(JSON.stringify({
            success: true,
            studentId,
            message: 'Student account created — credentials ready for login'
          }));
        } catch (error) {
          console.error('[approve-student] error:', error);
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: error.message }));
        }
      }

      // ── GET /api/subscription-pricing — List pricing plans ──
      if (req.url === '/api/subscription-pricing' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        try {
          const rows = await dbQuery('SELECT * FROM subscription_pricing WHERE is_active = true ORDER BY price_monthly ASC, price_yearly ASC');
          return res.end(JSON.stringify(rows));
        } catch (error) {
          console.error('[subscription-pricing] GET error:', error);
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: error.message }));
        }
      }

      // ── POST /api/subscription-pricing — Create/update pricing plan (founder) ──
      if (req.url === '/api/subscription-pricing' && req.method === 'POST') {
        res.setHeader('Content-Type', 'application/json');
        try {
          const body = await parseBody(req);
          const { id, plan_name, plan_name_ar, plan_type, price_monthly, price_yearly, currency, trial_days, features, is_active } = body;
          if (!plan_name) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'plan_name is required' }));
          }
          if (id) {
            // Update existing
            const result = await dbQuery(
              `UPDATE subscription_pricing SET plan_name=$1, plan_name_ar=$2, plan_type=$3, price_monthly=$4, price_yearly=$5, currency=$6, trial_days=$7, features=$8, is_active=$9, updated_at=NOW() WHERE id=$10 RETURNING *`,
              [plan_name, plan_name_ar || null, plan_type || 'teacher', price_monthly || 0, price_yearly || 0, currency || 'EGP', trial_days || 30, JSON.stringify(features || []), is_active !== false, id]
            );
            if (result.length === 0) {
              res.statusCode = 404;
              return res.end(JSON.stringify({ error: 'Plan not found' }));
            }
            return res.end(JSON.stringify(result[0]));
          } else {
            // Create new
            const result = await dbQuery(
              `INSERT INTO subscription_pricing (plan_name, plan_name_ar, plan_type, price_monthly, price_yearly, currency, trial_days, features, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
              [plan_name, plan_name_ar || null, plan_type || 'teacher', price_monthly || 0, price_yearly || 0, currency || 'EGP', trial_days || 30, JSON.stringify(features || []), is_active !== false]
            );
            return res.end(JSON.stringify(result[0]));
          }
        } catch (error) {
          console.error('[subscription-pricing] POST error:', error);
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: error.message }));
        }
      }

      // ── DELETE /api/subscription-pricing/:id — Delete pricing plan ──
      if (req.url?.startsWith('/api/subscription-pricing/') && req.method === 'DELETE') {
        res.setHeader('Content-Type', 'application/json');
        try {
          const planId = req.url.split('/api/subscription-pricing/')[1];
          await dbQuery('UPDATE subscription_pricing SET is_active = false, updated_at = NOW() WHERE id = $1', [planId]);
          return res.end(JSON.stringify({ success: true }));
        } catch (error) {
          console.error('[subscription-pricing] DELETE error:', error);
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: error.message }));
        }
      }

      // ── GET /api/teacher-subscription-requests — List all teacher subscription requests (founder) ──
      if (req.url === '/api/teacher-subscription-requests' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        try {
          const rows = await dbQuery('SELECT * FROM teacher_subscription_requests ORDER BY created_at DESC');
          return res.end(JSON.stringify(rows));
        } catch (error) {
          console.error('[teacher-subscription-requests] GET error:', error);
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: error.message }));
        }
      }

      // ── POST /api/teacher-subscription-requests/:id/approve — Approve teacher subscription with trial ──
      if (req.url?.startsWith('/api/teacher-subscription-requests/') && req.url.endsWith('/approve') && req.method === 'POST') {
        res.setHeader('Content-Type', 'application/json');
        try {
          const requestId = req.url.split('/api/teacher-subscription-requests/')[1].split('/')[0];
          const body = await parseBody(req);
          const { trial_days, founder_notes, is_trial } = body;

          const rows = await dbQuery('SELECT * FROM teacher_subscription_requests WHERE id = $1', [requestId]);
          if (rows.length === 0) {
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: 'Request not found' }));
          }

          const request = rows[0];
          const trialDuration = trial_days || 30;
          const now = new Date();
          const trialEnd = new Date(now);
          trialEnd.setDate(trialEnd.getDate() + trialDuration);

          if (is_trial) {
            // Approve with free trial
            await dbQuery(
              `UPDATE teacher_subscription_requests SET status = 'trial_active', trial_start_date = $1, trial_end_date = $2, approved_at = NOW(), founder_notes = $3, updated_at = NOW() WHERE id = $4`,
              [now.toISOString(), trialEnd.toISOString(), founder_notes || `Free trial for ${trialDuration} days`, requestId]
            );
          } else {
            // Approve paid subscription
            const expiresAt = new Date(now);
            if (request.plan_type === 'yearly') expiresAt.setFullYear(expiresAt.getFullYear() + 1);
            else expiresAt.setMonth(expiresAt.getMonth() + 1);

            await dbQuery(
              `UPDATE teacher_subscription_requests SET status = 'active', approved_at = NOW(), activated_at = NOW(), expires_at = $1, founder_notes = $2, updated_at = NOW() WHERE id = $3`,
              [expiresAt.toISOString(), founder_notes || 'Paid subscription activated', requestId]
            );
          }

          return res.end(JSON.stringify({ success: true, message: is_trial ? 'Trial activated' : 'Subscription activated' }));
        } catch (error) {
          console.error('[teacher-subscription-requests] approve error:', error);
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: error.message }));
        }
      }

      // ── POST /api/teacher-subscription-requests/:id/reject — Reject teacher subscription ──
      if (req.url?.startsWith('/api/teacher-subscription-requests/') && req.url.endsWith('/reject') && req.method === 'POST') {
        res.setHeader('Content-Type', 'application/json');
        try {
          const requestId = req.url.split('/api/teacher-subscription-requests/')[1].split('/')[0];
          const body = await parseBody(req);
          const { founder_notes } = body;

          await dbQuery(
            `UPDATE teacher_subscription_requests SET status = 'rejected', founder_notes = $1, updated_at = NOW() WHERE id = $2`,
            [founder_notes || 'Rejected by founder', requestId]
          );

          return res.end(JSON.stringify({ success: true, message: 'Request rejected' }));
        } catch (error) {
          console.error('[teacher-subscription-requests] reject error:', error);
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: error.message }));
        }
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

async function handleCreateCheckoutSession(req, res, user) {
  try {
    const rawBody = await parseRawBody(req);
    const { school_id, plan, billing_cycle, success_url, cancel_url } = JSON.parse(rawBody || '{}');
    
    // التحقق من أن المستخدم يملك هذه المدرسة
    const userSchoolId = user.school_id || user.id;
    if (school_id && school_id !== userSchoolId) {
      res.statusCode = 403;
      return res.end(JSON.stringify({ error: 'Forbidden: school_id mismatch' }));
    }
    const targetSchoolId = school_id || userSchoolId;
    
    if (!targetSchoolId) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'No school_id' }));
    }

    // جلب بيانات المدرسة
    const schoolRows = await sql`SELECT id, name, email, plan, billing_cycle FROM schools WHERE id = ${targetSchoolId}`.catch(()=>[]);
    if (!schoolRows.length) {
      res.statusCode = 404;
      return res.end(JSON.stringify({ error: 'School not found' }));
    }
    const school = schoolRows[0];
    const finalPlan = plan || school.plan || 'starter';
    const finalCycle = billing_cycle || school.billing_cycle || 'monthly';
    
    // أسعار الخطط
    const planPrices = { starter: 49, professional: 99, enterprise: 199 };
    const basePrice = planPrices[finalPlan] || 99;
    const amount = finalCycle === 'yearly' ? Math.round(basePrice * 12 * 0.8) : basePrice; // 20% خصم للسنوي

    // التحقق من وجود Stripe
    if (!STRIPE_SECRET) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: 'Stripe not configured. Set STRIPE_SECRET_KEY.' }));
    }

    // إنشاء جلسة Stripe
    const stripe = (await import('stripe')).default(STRIPE_SECRET);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: success_url || `${process.env.FRONTEND_URL || 'https://edutrack.app'}/renew-subscription?success=true`,
      cancel_url: cancel_url || `${process.env.FRONTEND_URL || 'https://edutrack.app'}/renew-subscription?canceled=true`,
      customer_email: school.email || undefined,
      metadata: {
        school_id: targetSchoolId,
        plan: finalPlan,
        billing_cycle: finalCycle,
      },
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `EduTrack ${finalPlan.charAt(0).toUpperCase() + finalPlan.slice(1)} Plan`,
            description: `${finalCycle === 'yearly' ? 'Annual' : 'Monthly'} subscription for ${school.name}`,
            metadata: { school_id: targetSchoolId, plan: finalPlan, billing_cycle: finalCycle },
          },
          unit_amount: amount * 100, // Stripe uses cents
        },
        quantity: 1,
      }],
    });

    // سجل الجلسة كمعلقة
    await sql`
      INSERT INTO subscription_payments (school_id, provider, provider_payment_id, provider_session_id, amount, currency, status, billing_cycle, plan, metadata)
      VALUES (${targetSchoolId}, 'stripe', ${session.id}, ${session.id}, ${amount}, 'USD', 'pending', ${finalCycle}, ${finalPlan}, ${JSON.stringify({ stripe_session_id: session.id })})
      ON CONFLICT (provider, provider_payment_id) DO UPDATE SET status = 'pending', updated_at = NOW()
    `.catch(e => console.error('[checkout] insert failed:', e.message));

    res.end(JSON.stringify({ url: session.url, session_id: session.id }));
  } catch (e) {
    console.error('[checkout] error:', e.message);
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

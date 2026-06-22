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
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (e) { reject(e); }
    });
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
          if (identifier === 'admin@edutrack.com' && password === 'admin123') {
            const user = {
                id: 'admin-id',
                full_name: 'System Admin',
                email: 'admin@edutrack.com',
                role: 'admin'
            };
            const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
            return res.end(JSON.stringify({
              success: true,
              user,
              token
            }));
          } else {
            res.statusCode = 401;
            return res.end(JSON.stringify({ error: 'Invalid admin credentials' }));
          }
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
              role: 'teacher'
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
              role: 'student'
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
              student_id: student.id
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
              role: 'bus'
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
              role: staffRole
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

    if (!req.url.startsWith('/neon-db/entities/')) return next();

    res.setHeader('Content-Type', 'application/json');

    // JWT Authentication Middleware
    const authHeader = req.headers.authorization;
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
        const rows = await dbQuery(`SELECT * FROM ${table} WHERE id = $1`, [entityId]);
        if (rows.length === 0) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ error: 'Not found' }));
        }
        return res.end(JSON.stringify(rows[0]));
      }

      // ===== CREATE =====
      if (req.method === 'POST') {
        const body = await parseBody(req);
        
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
        const q = `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`;
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
        await dbQuery(`DELETE FROM ${table} WHERE id = $1`, [entityId]);
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
    const { userId } = socket.handshake.query;
    if (userId) {
      socket.userId = userId;
    }

    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`[Socket.io] Socket ${socket.id} joined drawing room ${roomId}`);
    });

    socket.on('join-webrtc-room', (roomId) => {
      socket.join(roomId);
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
            if (clientSocket && clientSocket.userId === targetUserId) {
              clientSocket.emit('signal', data);
            }
          }
        }
      } else {
        // بث الإشارة للجميع ما عدا المرسل
        socket.broadcast.to(roomId).emit('signal', data);
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket.io] Disconnected:', socket.id);
    });
  });
}

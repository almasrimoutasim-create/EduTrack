import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

function hashPassword(password) {
  if (!password) return '';
  return crypto.createHash('sha256').update(password + 'edutrack_salt_2026').digest('hex');
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
            return res.end(JSON.stringify({
              success: true,
              user: {
                id: 'admin-id',
                full_name: 'System Admin',
                email: 'admin@edutrack.com',
                role: 'admin'
              }
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
          const hashed = hashPassword(password);
          if (teacher.portal_password !== hashed) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ error: 'Invalid password' }));
          }
          return res.end(JSON.stringify({
            success: true,
            user: {
              id: teacher.id,
              full_name: teacher.full_name,
              email: teacher.email,
              role: 'teacher'
            }
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
          const hashed = hashPassword(password);
          if (student.portal_password !== hashed) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ error: 'Invalid password' }));
          }
          return res.end(JSON.stringify({
            success: true,
            user: {
              id: student.id,
              full_name: student.full_name,
              email: student.user_email,
              role: 'student'
            }
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
          const hashed = hashPassword(password);
          if (student.parent_password !== hashed) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ error: 'Invalid password' }));
          }
          return res.end(JSON.stringify({
            success: true,
            user: {
              id: 'parent-' + student.id,
              full_name: student.parent_name || 'Parent',
              email: student.parent_email,
              role: 'parent',
              student_id: student.id
            }
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
          const hashed = hashPassword(password);
          if (supervisor.portal_password !== hashed) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ error: 'Invalid password' }));
          }
          return res.end(JSON.stringify({
            success: true,
            user: {
              id: supervisor.id,
              full_name: supervisor.full_name,
              email: supervisor.email,
              role: 'bus'
            }
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
          const hashed = hashPassword(password);
          if (staff.portal_password !== hashed) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ error: 'Invalid password' }));
          }
          
          let staffRole = staff.role || 'staff';
          if (staffRole === 'store_keeper') staffRole = 'store';

          return res.end(JSON.stringify({
            success: true,
            user: {
              id: staff.id,
              full_name: staff.full_name,
              email: staff.email,
              role: staffRole
            }
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
                const col = sanitizeColumn(key);
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
        res.statusCode = 201;
        return res.end(JSON.stringify(rows[0]));
      }

      // ===== UPDATE =====
      if (req.method === 'PUT' && entityId) {
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
        const q = `UPDATE ${table} SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`;
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

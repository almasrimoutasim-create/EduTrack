import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

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
};

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
  return sql.query(queryStr, params);
}

export function setupApiRoutes(server) {
  server.middlewares.use(async (req, res, next) => {
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
      console.error('API Error:', error.message);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: error.message }));
    }
  });
}

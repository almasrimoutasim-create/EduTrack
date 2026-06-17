const fs = require('fs');

let api = fs.readFileSync('server/api.js', 'utf8');

// 1. Replace crypto and hashPassword
api = api.replace(
`import crypto from 'crypto';
dotenv.config();

function hashPassword(password) {
  if (!password) return '';
  return crypto.createHash('sha256').update(password + 'edutrack_salt_2026').digest('hex');
}`,
`import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'edutrack_secure_jwt_secret_2026_fallback';

function hashPassword(password) {
  if (!password) return '';
  return bcrypt.hashSync(password, 10);
}`
);

// 2. Update Admin Login
api = api.replace(
`        // 1. Admin login
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
        }`,
`        // 1. Admin login
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
        }`
);

// 3. Update Teacher Login
api = api.replace(
`          const hashed = hashPassword(password);
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
          }));`,
`          if (!bcrypt.compareSync(password, teacher.portal_password)) {
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
          }));`
);

// 4. Update Student Login
api = api.replace(
`          const hashed = hashPassword(password);
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
          }));`,
`          if (!bcrypt.compareSync(password, student.portal_password)) {
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
          }));`
);

// 5. Update Parent Login
api = api.replace(
`          const hashed = hashPassword(password);
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
          }));`,
`          if (!bcrypt.compareSync(password, student.parent_password)) {
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
          }));`
);

// 6. Update Bus Login
api = api.replace(
`          const hashed = hashPassword(password);
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
          }));`,
`          if (!bcrypt.compareSync(password, supervisor.portal_password)) {
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
          }));`
);

// 7. Update Staff Login
api = api.replace(
`          const hashed = hashPassword(password);
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
          }));`,
`          if (!bcrypt.compareSync(password, staff.portal_password)) {
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
          }));`
);

// 8. Add JWT validation middleware to /neon-db/entities/
api = api.replace(
`    if (!req.url.startsWith('/neon-db/entities/')) return next();

    res.setHeader('Content-Type', 'application/json');`,
`    if (!req.url.startsWith('/neon-db/entities/')) return next();

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
    }`
);

fs.writeFileSync('server/api.js', api);
console.log('Patch complete!');

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApiHandler, setupWebSocket } from './server/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 3000;

// Enable CORS for Vercel frontend + local dev
app.use(cors({
  origin: [
    'https://edu-track-smoky-two.vercel.app',
    'https://edu-track-f93fvpqkt-almasrimoutasim-creates-projects.vercel.app',
    /^https:\/\/.*\.vercel\.app$/,
    'https://edutrack-ey49.onrender.com',
    'https://edutrack-ub8f.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Founder-Auth']
}));

// ⚠️ هام جداً: إضافة محلل بيانات الـ JSON لقراءة الطلبات القادمة من الواجهة الأمامية (مثل تسجيل الدخول)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve built frontend static files FIRST (before API handler)
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Serve STUN configuration for WebRTC
app.get('/api/ice-config', (_req, res) => {
  res.json({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ]
  });
});

// Health check (useful for Render) — before API handler so it's not intercepted
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Debug: verify DATABASE_URL and registration_requests table (must be before API handler)
app.get('/api/debug/db-health', async (_req, res) => {
  try {
    const { neon } = await import('./server/db_compat.js');
    const dbUrl = process.env.DATABASE_URL ? 'SET (length=' + process.env.DATABASE_URL.length + ')' : 'NOT SET';
    const sql = neon(process.env.DATABASE_URL);
    if (!sql) return res.json({ status: 'error', error: 'DATABASE_URL not set' });
    
    let tableExists = false;
    let columns = [];
    let rowCount = 0;
    let sampleRows = [];
    try {
      const t = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'registration_requests') as exists`;
      tableExists = t[0]?.exists;
      if (tableExists) {
        const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'registration_requests' ORDER BY ordinal_position`;
        columns = cols.map(c => c.column_name);
        const cnt = await sql`SELECT count(*)::int as cnt FROM registration_requests`;
        rowCount = cnt[0]?.cnt || 0;
        sampleRows = await sql`SELECT id, full_name, email, school_name, director_name, plan, role_requested, status, created_at FROM registration_requests ORDER BY created_at DESC LIMIT 5`;
      }
    } catch (e) {
      return res.json({ status: 'error', phase: 'table_check', error: e.message, databaseUrl: dbUrl });
    }

    res.json({
      status: 'ok',
      databaseUrl: dbUrl,
      registration_requests: {
        exists: tableExists,
        columns,
        rowCount,
        sampleRows,
      }
    });
  } catch (err) {
    res.json({ status: 'error', error: err.message });
  }
});

// Debug: test INSERT into registration_requests directly
app.post('/api/debug/test-registration', async (req, res) => {
  try {
    const { neon } = await import('./server/db_compat.js');
    const sql = neon(process.env.DATABASE_URL);
    if (!sql) return res.json({ status: 'error', error: 'DATABASE_URL not set' });
    
    const body = req.body;
    const fullName = body.full_name || 'Test User';
    const email = body.email || 'test@example.com';
    const schoolName = body.school_name || 'Test School';
    const directorName = body.director_name || 'Test Director';
    const plan = body.plan || 'starter';
    const country = body.country || 'العراق';
    const phone = body.phone || '000000000';
    
    const rows = await sql`INSERT INTO registration_requests (full_name, email, school_name, director_name, plan, country, phone, role_requested, status) VALUES (${fullName}, ${email}, ${schoolName}, ${directorName}, ${plan}, ${country}, ${phone}, 'school_admin', 'pending') RETURNING *`;
    
    res.json({ status: 'ok', inserted: rows[0] });
  } catch (err) {
    res.json({ status: 'error', error: err.message, stack: err.stack });
  }
});

// Mount API routes AFTER static files
app.use(createApiHandler());

// SPA fallback for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[EduTrack] Server running on port ${PORT}`);
  console.log(`[EduTrack] API available at /neon-db/*`);
});

// Attach WebSocket server for virtual classroom
setupWebSocket(server);
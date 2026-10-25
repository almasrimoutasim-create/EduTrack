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

// Enable CORS for Vercel frontend + local dev — valid header values only, no wildcard with credentials
const ALLOWED_ORIGINS = [
  'https://edu-track-smoky-two.vercel.app',
  'https://edu-track-f93fvpqkt-almasrimoutasim-creates-projects.vercel.app',
  'https://edutrack-ey49.onrender.com',
  'https://edutrack-ub8f.onrender.com',
  'https://edutrack-2689.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000'
];
const VERCEL_REGEX = /^https:\/\/.*\.vercel\.app$/;
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin) || VERCEL_REGEX.test(origin)) return callback(null, true);
    console.warn('[CORS] blocked origin:', origin);
    // In production, still allow but log; never hard-fail to avoid breaking fetches
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Founder-Auth', 'X-School-Id', 'X-Branch-Id', 'x-branch-id'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  credentials: false,
  optionsSuccessStatus: 204,
  maxAge: 86400
}));
// Trust reverse proxies (Render, Vercel, Cloudflare) for accurate HTTPS detection
app.set('trust proxy', 1);

// Enforce permissions policy for WebRTC media capture (Camera, Mic, Screen Share)
app.use((_req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(self "*"), microphone=(self "*"), display-capture=(self "*")'
  );
  next();
});


// محلل بيانات الـ JSON لقراءة الطلبات القادمة من الواجهة الأمامية
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

import fs from 'fs';
import sql from './server/db.js';

// Serve built frontend static files FIRST (before API handler)
app.use(express.static(path.join(__dirname, 'dist')));

// Serve persistent uploads (from disk or Neon PostgreSQL database fallback)
app.get('/uploads/:filename', async (req, res, next) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(__dirname, 'public', 'uploads', filename);

  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }

  // Fallback to Neon database storage if ephemeral disk was wiped on restart
  try {
    const rows = await sql`SELECT mime_type, file_data FROM system_uploaded_files WHERE filename = ${filename} LIMIT 1`;
    if (rows && rows.length > 0) {
      const mime = rows[0].mime_type || 'image/png';
      const cleanData = String(rows[0].file_data).replace(/^data:[^;]+;base64,/, '');
      const buf = Buffer.from(cleanData, 'base64');
      try {
        const uploadDir = path.join(__dirname, 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(filePath, buf);
      } catch (_) {}
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.end(buf);
    }
  } catch (err) {
    console.warn('[EduTrack] Error querying system_uploaded_files for', filename, err.message);
  }

  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Serve STUN/TURN configuration for WebRTC
app.get('/api/ice-config', (_req, res) => {
  res.json({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      // Free TURN server from openrelay.metered.ca (works without subscription)
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turns:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ]
  });
});

// Health check (useful for Render)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Register API routes before accepting requests so Render never serves the SPA
// fallback for an API call during startup.
let apiHandler;
try {
  apiHandler = createApiHandler();
  app.use(apiHandler);
} catch (err) {
  console.error(`[EduTrack] Error initializing API:`, err);
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[EduTrack] Server running on port ${PORT}`);
  try {
    setupWebSocket(server);
    console.log(`[EduTrack] WebSocket successfully initialized.`);
  } catch (err) {
    console.error(`[EduTrack] Error initializing WebSocket:`, err);
  }
});

// SPA fallback for client-side routing
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
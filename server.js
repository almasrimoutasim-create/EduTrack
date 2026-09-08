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
    'https://edutrack-2689.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Founder-Auth']
}));

// محلل بيانات الـ JSON لقراءة الطلبات القادمة من الواجهة الأمامية
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

// Health check (useful for Render)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// تشغيل الخادم أولاً واستماع المنفذ لضمان عدم تعليق الإقلاع على Render
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[EduTrack] Server running on port ${PORT}`);

  // ربط الـ API والـ WebSocket بعد استجابة الخادم لضمان سلامة الاتصال بقاعدة البيانات
  try {
    app.use(createApiHandler());
    setupWebSocket(server);
    console.log(`[EduTrack] API routes and WebSocket successfully initialized.`);
  } catch (err) {
    console.error(`[EduTrack] Error initializing API/WebSocket:`, err);
  }
});

// SPA fallback for client-side routing
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
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
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Mount Neon DB API routes FIRST (before static or body parsers)
app.use(createApiHandler());

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

// Serve built frontend static files
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Health check (useful for Render)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

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

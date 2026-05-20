import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApiHandler } from './server/api.js';

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

// Serve built frontend static files
app.use(express.static(path.join(__dirname, 'dist')));

// Health check (useful for Render)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// SPA fallback for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[EduTrack] Server running on port ${PORT}`);
  console.log(`[EduTrack] API available at /neon-db/*`);
});

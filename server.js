import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApiHandler } from './server/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 3000;

// Mount Neon DB API routes FIRST (before static or body parsers)
app.use(createApiHandler());

// Serve built frontend static files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[EduTrack] Server running on port ${PORT}`);
  console.log(`[EduTrack] API available at /neon-db/*`);
});

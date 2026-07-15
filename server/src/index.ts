import { createServer } from 'http';
import path from 'path';

import express from 'express';

import './state/db.js';
import { authRouter } from './auth/routes.js';
import { config } from './config.js';
import { djRouter } from './dj/routes.js';
import { projectRoot } from './paths.js';
import { schedulerRouter } from './scheduler/routes.js';
import { startScheduler } from './scheduler/index.js';
import { spotifyRouter } from './spotify/routes.js';
import { tasteRouter } from './taste/routes.js';
import { userRouter } from './user/routes.js';
import { initWebSocket } from './ws/index.js';

const app = express();

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRouter);
app.use('/api', userRouter);
app.use('/api/dj', djRouter);
app.use('/api/scheduler', schedulerRouter);
app.use('/api/spotify', spotifyRouter);
app.use('/api/taste', tasteRouter);

// In production, Express serves the built Vite client. This must come AFTER
// all /api routes so API routes take priority over the static file fallback.
if (config.nodeEnv === 'production') {
  const clientDist = path.join(projectRoot(), 'client/dist');
  app.use(express.static(clientDist));
  // Catch-all: return index.html for any non-API route (SPA fallback).
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const server = createServer(app);
initWebSocket(server);

// Bind to 0.0.0.0 in production so Render's router can reach the process.
// In development, bind to 127.0.0.1 — Spotify rejects 'localhost' redirect URIs.
const host = config.nodeEnv === 'production' ? '0.0.0.0' : '127.0.0.1';
server.listen(config.port, host, () => {
  console.log(`[server] listening on http://${host}:${config.port} (${config.nodeEnv})`);
  startScheduler();
  console.log('[scheduler] started');
});

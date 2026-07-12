import { createServer } from 'http';

import express from 'express';

import './state/db.js';
import { authRouter } from './auth/routes.js';
import { config } from './config.js';
import { djRouter } from './dj/routes.js';
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

const server = createServer(app);
initWebSocket(server);

// Bind to 127.0.0.1 explicitly: Spotify rejects 'localhost' in OAuth redirect URIs.
server.listen(config.port, '127.0.0.1', () => {
  console.log(`[server] listening on http://127.0.0.1:${config.port} (${config.nodeEnv})`);
  startScheduler();
  console.log('[scheduler] started');
});

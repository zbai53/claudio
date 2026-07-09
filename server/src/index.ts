import express from 'express';

import './state/db.js';
import { authRouter } from './auth/routes.js';
import { config } from './config.js';
import { djRouter } from './dj/routes.js';
import { schedulerRouter } from './scheduler/routes.js';
import { startScheduler } from './scheduler/index.js';
import { userRouter } from './user/routes.js';

const app = express();

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRouter);
app.use('/api', userRouter);
app.use('/api/dj', djRouter);
app.use('/api/scheduler', schedulerRouter);

// Bind to 127.0.0.1 explicitly: Spotify rejects 'localhost' in OAuth redirect URIs.
app.listen(config.port, '127.0.0.1', () => {
  console.log(`[server] listening on http://127.0.0.1:${config.port} (${config.nodeEnv})`);
  startScheduler();
  console.log('[scheduler] started');
});

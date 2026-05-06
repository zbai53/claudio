import express from 'express';

import './state/db.js';
import { authRouter } from './auth/routes.js';
import { config } from './config.js';

const app = express();

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRouter);

// Bind to 127.0.0.1 explicitly: Spotify rejects 'localhost' in OAuth redirect URIs.
app.listen(config.port, '127.0.0.1', () => {
  console.log(
    `[server] listening on http://127.0.0.1:${config.port} (${config.nodeEnv})`,
  );
});

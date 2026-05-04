import express from 'express';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// 用 127.0.0.1 而不是 localhost,与 Spotify redirect URI 保持一致
app.listen(PORT, '127.0.0.1', () => {
  console.log(`[server] listening on http://127.0.0.1:${PORT}`);
});
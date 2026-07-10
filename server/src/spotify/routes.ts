import { Router } from 'express';

import { getValidAccessToken } from '../auth/tokenService.js';
import { playTracks } from './playback.js';

export const spotifyRouter = Router();

let activeDeviceId: string | null = null;

export function getActiveDeviceId(): string | null {
  return activeDeviceId;
}

spotifyRouter.post('/device', (req, res) => {
  const { deviceId } = req.body as { deviceId?: string };
  if (typeof deviceId !== 'string' || !deviceId) {
    res.status(400).json({ error: { code: 'INVALID_DEVICE_ID', message: 'deviceId is required' } });
    return;
  }
  activeDeviceId = deviceId;
  res.json({ ok: true });
});

// The frontend Spotify Web Playback SDK needs a fresh access token to
// initialize its player. We serve it here rather than embedding it in HTML
// or a cookie, so the token is never visible in the page source or devtools
// network tab as a query parameter.
spotifyRouter.get('/token', async (_req, res) => {
  try {
    const token = await getValidAccessToken();
    res.json({ token });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[spotify] token fetch failed:', message);
    res.status(401).json({ error: { code: 'TOKEN_UNAVAILABLE', message } });
  }
});

spotifyRouter.post('/play', async (req, res) => {
  const { uris, trigger } = req.body as { uris?: string[]; trigger?: string };

  if (!Array.isArray(uris) || uris.length === 0) {
    res
      .status(400)
      .json({ error: { code: 'INVALID_URIS', message: 'uris must be a non-empty array' } });
    return;
  }

  try {
    await playTracks(uris, trigger ?? 'manual');
    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[spotify] play failed:', message);
    res.status(500).json({ error: { code: 'PLAY_FAILED', message } });
  }
});

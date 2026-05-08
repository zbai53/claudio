import { Router } from 'express';

import { getValidAccessToken } from '../auth/tokenService.js';

const SPOTIFY_ME_URL = 'https://api.spotify.com/v1/me';

// Subset of fields we read from Spotify's /v1/me response.
// `display_name` can be null (Spotify allows users without one).
// `images` is an array, often empty for users without a profile picture.
interface SpotifyMeResponse {
  id: string;
  display_name: string | null;
  images: Array<{ url: string; height: number | null; width: number | null }>;
  external_urls: { spotify: string };
}

// Our public-facing user profile shape. camelCase, only the fields the
// frontend actually needs. Decoupled from Spotify's response so we can
// add or remove fields without breaking clients.
export interface UserProfile {
  id: string;
  displayName: string;
  imageUrl: string | null;
  spotifyUrl: string;
}

export const userRouter: Router = Router();

userRouter.get('/me', async (_req, res) => {
  let accessToken: string;
  try {
    accessToken = await getValidAccessToken();
  } catch (err) {
    // Either no tokens stored (never logged in) or refresh failed
    // (user revoked access). Both cases require a fresh login.
    console.error('[user] no valid token:', err);
    res.status(401).json({
      error: 'not_authenticated',
      message: 'Please log in via /api/auth/login',
    });
    return;
  }

  let response: Response;
  try {
    response = await fetch(SPOTIFY_ME_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (err) {
    console.error('[user] spotify network error:', err);
    res.status(502).json({ error: 'upstream_unreachable' });
    return;
  }

  if (response.status === 401) {
    // Edge case: token was valid when we fetched it but Spotify rejected
    // it. Could be revocation between getValidAccessToken and now.
    // Don't auto-retry refresh here — the service already tried.
    console.error('[user] spotify rejected token even after refresh');
    res.status(401).json({
      error: 'spotify_rejected_token',
      message: 'Please log in again',
    });
    return;
  }

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[user] spotify /me failed (${response.status}):`, errorBody);
    res.status(502).json({ error: 'spotify_error', status: response.status });
    return;
  }

  const data = (await response.json()) as SpotifyMeResponse;

  // Translate Spotify's response to our public shape. Pick the largest
  // image when available (images array is sorted largest-first per docs).
  const profile: UserProfile = {
    id: data.id,
    // Fall back to id when Spotify has no display_name to avoid sending
    // "null" to the frontend.
    displayName: data.display_name ?? data.id,
    imageUrl: data.images[0]?.url ?? null,
    spotifyUrl: data.external_urls.spotify,
  };

  res.json(profile);
});

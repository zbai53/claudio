import { Router } from 'express';

import { config } from '../config.js';
import { tokenRepository } from '../state/tokenRepository.js';

import { generateCodeChallenge, generateCodeVerifier, generateState } from './pkce.js';
import { consumePendingAuth, savePendingAuth } from './store.js';

const SPOTIFY_AUTHORIZE_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

// Phase 1 only needs profile read access. More scopes come in Phase 4-5
// when we add playback control and listening history reads.
const SCOPES = ['user-read-private', 'user-read-email'];

// Shape of the response from Spotify's token endpoint. snake_case to
// match Spotify's API; we translate to camelCase when storing.
interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export const authRouter: Router = Router();

authRouter.get('/login', (_req, res) => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateState();

  savePendingAuth(state, codeVerifier);

  const params = new URLSearchParams({
    client_id: config.spotify.clientId,
    response_type: 'code',
    redirect_uri: config.spotify.redirectUri,
    state,
    scope: SCOPES.join(' '),
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });

  res.redirect(`${SPOTIFY_AUTHORIZE_URL}?${params.toString()}`);
});

authRouter.get('/callback', async (req, res) => {
  // 1. Parse query params. Spotify either gives us {code, state} on success
  //    or {error, state} on user cancel / scope rejection.
  const { code, state, error } = req.query;

  if (typeof error === 'string') {
    res.status(400).send(`Spotify returned an error: ${error}`);
    return;
  }

  if (typeof code !== 'string' || typeof state !== 'string') {
    res.status(400).send('Missing code or state in callback');
    return;
  }

  // 2. Validate state. consumePendingAuth() returns null if the state
  //    is unknown, expired, or already used — all three reject the callback.
  const codeVerifier = consumePendingAuth(state);
  if (!codeVerifier) {
    res.status(400).send('Invalid or expired state — possible CSRF or replay');
    return;
  }

  // 3. Exchange code+verifier for access_token. This is a server-to-server
  //    POST that never touches the browser. The verifier proves we're the
  //    same client that started the flow.
  const tokenRequestBody = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.spotify.redirectUri,
    client_id: config.spotify.clientId,
    code_verifier: codeVerifier,
  });

  let tokenResponse: Response;
  try {
    tokenResponse = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // Spotify recommends Basic Auth with client_id:client_secret as a
        // separate confidential-client signal, but for PKCE flow the
        // client_id in the body is sufficient. Public-client style.
      },
      body: tokenRequestBody.toString(),
    });
  } catch (err) {
    // Network-level failure (DNS, connection refused, etc.)
    console.error('[auth] token exchange network error:', err);
    res.status(502).send('Failed to reach Spotify token endpoint');
    return;
  }

  if (!tokenResponse.ok) {
    // Spotify returned a non-2xx — bad code, expired code, etc.
    const errorBody = await tokenResponse.text();
    console.error(`[auth] token exchange failed (${tokenResponse.status}):`, errorBody);
    res.status(502).send(`Spotify rejected the token exchange: ${tokenResponse.status}`);
    return;
  }

  const tokenData = (await tokenResponse.json()) as SpotifyTokenResponse;

  // 4. Persist tokens. Translate snake_case → camelCase, and convert
  //    expires_in (seconds, relative) → expires_at (epoch ms, absolute).
  tokenRepository.save({
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: Date.now() + tokenData.expires_in * 1000,
  });

  console.log('[auth] OAuth round-trip complete, tokens stored');

  // 5. Redirect back to the frontend. The frontend will detect the new
  // auth state by calling /api/me on load.
  res.redirect(config.client.url);
});

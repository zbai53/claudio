import { config } from '../config.js';
import { tokenRepository } from '../state/tokenRepository.js';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

// Refresh 1 minute before expiry. Buffer absorbs clock skew between our
// server and Spotify's, plus the latency of the refresh call itself.
const REFRESH_BUFFER_MS = 60 * 1000;

// Shape of Spotify's refresh response. snake_case to match the API.
// `refresh_token` is optional because Spotify sometimes omits it (in
// which case we keep using the existing one).
interface RefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  refresh_token?: string;
}

/**
 * Force a token refresh using the stored refresh_token. Persists the
 * new tokens. Returns the new access_token.
 *
 * Throws if the user is not logged in (no tokens to refresh) or if
 * Spotify rejects the refresh (user revoked access, refresh_token
 * expired, etc) — caller must redirect the user to /login.
 */
export async function refreshAccessToken(): Promise<string> {
  const tokens = tokenRepository.load();
  if (!tokens) {
    throw new Error('No stored tokens — user must log in first');
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: tokens.refreshToken,
    client_id: config.spotify.clientId,
  });

  let response: Response;
  try {
    response = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  } catch (err) {
    console.error('[auth] refresh network error:', err);
    throw new Error('Failed to reach Spotify token endpoint');
  }

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[auth] refresh failed (${response.status}):`, errorBody);
    throw new Error(`Spotify rejected the refresh: ${response.status}`);
  }

  const data = (await response.json()) as RefreshResponse;

  // Spotify may or may not rotate the refresh_token. If it does, store
  // the new one; if not, keep the existing one. Failing to handle this
  // correctly is a common bug — code that always uses data.refresh_token
  // will write `undefined` to the column on calls that don't rotate.
  tokenRepository.save({
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? tokens.refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  });

  console.log('[auth] access token refreshed');
  return data.access_token;
}

/**
 * Return a currently-valid access_token. Refreshes proactively if the
 * stored token expires within REFRESH_BUFFER_MS.
 *
 * This is the function business code should call. It hides the refresh
 * logic from callers — they always get a valid token (or an error).
 */
export async function getValidAccessToken(): Promise<string> {
  const tokens = tokenRepository.load();
  if (!tokens) {
    throw new Error('Not logged in — visit /api/auth/login to authenticate');
  }

  const expiresIn = tokens.expiresAt - Date.now();
  if (expiresIn < REFRESH_BUFFER_MS) {
    return refreshAccessToken();
  }

  return tokens.accessToken;
}

import { Router } from 'express';

import { config } from '../config.js';

import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
} from './pkce.js';
import { savePendingAuth } from './store.js';

const SPOTIFY_AUTHORIZE_URL = 'https://accounts.spotify.com/authorize';

// Phase 1 only needs profile read access. More scopes come in Phase 4-5
// when we add playback control and listening history reads.
const SCOPES = ['user-read-private', 'user-read-email'];

export const authRouter: Router = Router();

authRouter.get('/login', (_req, res) => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateState();

  // Save the verifier keyed by state. /callback will look it up using
  // the state Spotify echoes back, then use the verifier to exchange
  // the code for a token.
  savePendingAuth(state, codeVerifier);

  // URLSearchParams handles encoding correctly (e.g. spaces in scopes).
  // Don't hand-roll query string concatenation — it's a bug magnet.
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

/**
 * Temporary in-memory store for PKCE verifier + state during OAuth round-trip.
 *
 * Keyed by `state` because that's what Spotify echoes back to /callback.
 * When /callback receives a state, we look it up here to retrieve the
 * matching code_verifier (needed for the token exchange).
 *
 * Tech debt: in-memory means server restart drops pending logins. Fine
 * for single-user dev. Replace with SQLite (or signed HTTP-only cookie)
 * before any kind of deployment with restarts. Tracked in backlog.
 */

interface PendingAuth {
  codeVerifier: string;
  createdAt: number;
}

const store = new Map<string, PendingAuth>();

const TTL_MS = 10 * 60 * 1000; // 10 min: enough time to log in, short enough to limit replay window

export function savePendingAuth(state: string, codeVerifier: string): void {
  store.set(state, { codeVerifier, createdAt: Date.now() });
}

export function consumePendingAuth(state: string): string | null {
  const entry = store.get(state);
  if (!entry) return null;

  // Always delete on lookup — this entry is one-shot, even if expired.
  // Prevents replay attacks where someone reuses a state value.
  store.delete(state);

  if (Date.now() - entry.createdAt > TTL_MS) {
    return null;
  }
  return entry.codeVerifier;
}

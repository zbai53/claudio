/**
 * SQLite-backed PKCE store for OAuth state + code_verifier pairs.
 *
 * Persists across server restarts (important on Render's free tier, which
 * restarts on every deploy). One-shot: consuming a state deletes the row.
 * Entries expire after 10 minutes to limit the replay window.
 */

import { db } from '../state/db.js';

const TTL_MS = 10 * 60 * 1000; // 10 min

export function savePendingAuth(state: string, codeVerifier: string): void {
  db.prepare('INSERT INTO pkce_store (state, code_verifier) VALUES (?, ?)').run(
    state,
    codeVerifier,
  );
}

export function consumePendingAuth(state: string): string | null {
  // Purge stale entries before lookup.
  db.prepare('DELETE FROM pkce_store WHERE created_at < ?').run(Date.now() - TTL_MS);

  const consume = db.transaction((s: string) => {
    const row = db.prepare('SELECT code_verifier FROM pkce_store WHERE state = ?').get(s) as
      | { code_verifier: string }
      | undefined;
    if (!row) return null;
    db.prepare('DELETE FROM pkce_store WHERE state = ?').run(s);
    return row.code_verifier;
  });

  return consume(state);
}

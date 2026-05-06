import { db } from './db.js';

/**
 * Spotify OAuth tokens for the single user of this app.
 *
 * Stored in the `tokens` table with a CHECK constraint that pins id=1,
 * so there's only ever one row. The repository hides this detail from
 * callers — they save/load without thinking about row identity.
 */
export interface TokenRecord {
  accessToken: string;
  refreshToken: string;
  /** Unix epoch ms — compare against Date.now() to check expiry. */
  expiresAt: number;
}

// Prepared statements compile the SQL once and reuse it on every call.
// Faster than re-parsing SQL each time, and protects against SQL injection
// since user data goes through parameter binding rather than string concat.
const saveStmt = db.prepare(`
  INSERT OR REPLACE INTO tokens (id, access_token, refresh_token, expires_at, updated_at)
  VALUES (1, @accessToken, @refreshToken, @expiresAt, @updatedAt)
`);

const loadStmt = db.prepare(`
  SELECT access_token, refresh_token, expires_at
  FROM tokens
  WHERE id = 1
`);

// Shape of what loadStmt.get() returns — snake_case from the database.
// Kept private to this module since outside code uses TokenRecord (camelCase).
interface TokenRow {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export const tokenRepository = {
  /**
   * Upsert the user's tokens. INSERT OR REPLACE because the table has a
   * CHECK (id = 1) constraint — there's never more than one row, and we
   * want save() to work whether or not a row exists.
   */
  save(tokens: TokenRecord): void {
    saveStmt.run({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      updatedAt: Date.now(),
    });
  },

  /**
   * Load the stored tokens, or null if the user hasn't logged in yet.
   * Translates from snake_case columns to camelCase fields at the boundary.
   */
  load(): TokenRecord | null {
    const row = loadStmt.get() as TokenRow | undefined;
    if (!row) return null;
    return {
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      expiresAt: row.expires_at,
    };
  },
};

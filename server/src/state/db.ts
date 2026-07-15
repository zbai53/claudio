import path from 'node:path';
import { fileURLToPath } from 'node:url';

import Database from 'better-sqlite3';

import { config } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve DATABASE_PATH relative to project root, same way as .env loading.
// `.env` ships DATABASE_PATH=./data/claudio.db relative to project root.
const dbPath = path.resolve(__dirname, '../../..', config.databasePath);

// `better-sqlite3` is synchronous — every call blocks the event loop briefly.
// For a single-user local app this is faster and simpler than async drivers.
// In a multi-user web server this would be the wrong choice.
export const db = new Database(dbPath);

// Foreign keys are off by default in SQLite, which is a footgun.
// Turn them on once at connection time.
db.pragma('foreign_keys = ON');

// WAL (Write-Ahead Logging) gives better concurrency and durability than
// the default journal mode. Standard practice for any non-trivial SQLite app.
db.pragma('journal_mode = WAL');

// Schema migration: create tables if they don't exist. Idempotent — safe to
// run on every startup. Real apps use a migration framework, but for a
// single-table single-user app this is enough.
db.exec(`
  CREATE TABLE IF NOT EXISTS tokens (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );

  CREATE TABLE IF NOT EXISTS plays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_uri TEXT NOT NULL,
    track_name TEXT NOT NULL,
    artist_name TEXT NOT NULL,
    trigger TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );

  CREATE TABLE IF NOT EXISTS plan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    tracks_json TEXT NOT NULL,
    say TEXT NOT NULL,
    segue TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );

  CREATE TABLE IF NOT EXISTS prefs (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );

  CREATE TABLE IF NOT EXISTS pkce_store (
    state TEXT PRIMARY KEY,
    code_verifier TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );
`);

console.log(`[db] connected to ${dbPath}`);

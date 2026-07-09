import { db } from './db.js';

// ---------------------------------------------------------------------------
// Plays
// ---------------------------------------------------------------------------

export interface PlayRecord {
  id: number;
  trackUri: string;
  trackName: string;
  artistName: string;
  trigger: string;
  createdAt: number;
}

interface PlayRow {
  id: number;
  track_uri: string;
  track_name: string;
  artist_name: string;
  trigger: string;
  created_at: number;
}

const insertPlayStmt = db.prepare(`
  INSERT INTO plays (track_uri, track_name, artist_name, trigger)
  VALUES (@trackUri, @trackName, @artistName, @trigger)
`);

const selectPlayByIdStmt = db.prepare(`
  SELECT id, track_uri, track_name, artist_name, trigger, created_at
  FROM plays
  WHERE id = ?
`);

const selectRecentPlaysStmt = db.prepare(`
  SELECT id, track_uri, track_name, artist_name, trigger, created_at
  FROM plays
  ORDER BY created_at DESC
  LIMIT ?
`);

function rowToPlay(row: PlayRow): PlayRecord {
  return {
    id: row.id,
    trackUri: row.track_uri,
    trackName: row.track_name,
    artistName: row.artist_name,
    trigger: row.trigger,
    createdAt: row.created_at,
  };
}

export function logPlay(
  trackUri: string,
  trackName: string,
  artistName: string,
  trigger: string,
): PlayRecord {
  const result = insertPlayStmt.run({ trackUri, trackName, artistName, trigger });
  const row = selectPlayByIdStmt.get(result.lastInsertRowid) as PlayRow;
  return rowToPlay(row);
}

export function getRecentPlays(limit: number = 20): PlayRecord[] {
  const rows = selectRecentPlaysStmt.all(limit) as PlayRow[];
  return rows.map(rowToPlay);
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export interface MessageRecord {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

interface MessageRow {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: number;
}

const insertMessageStmt = db.prepare(`
  INSERT INTO messages (role, content)
  VALUES (@role, @content)
`);

const selectMessageByIdStmt = db.prepare(`
  SELECT id, role, content, created_at
  FROM messages
  WHERE id = ?
`);

const selectRecentMessagesStmt = db.prepare(`
  SELECT id, role, content, created_at
  FROM messages
  ORDER BY created_at DESC
  LIMIT ?
`);

function rowToMessage(row: MessageRow): MessageRecord {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  };
}

export function logMessage(role: 'user' | 'assistant', content: string): MessageRecord {
  const result = insertMessageStmt.run({ role, content });
  const row = selectMessageByIdStmt.get(result.lastInsertRowid) as MessageRow;
  return rowToMessage(row);
}

export function getRecentMessages(limit: number = 50): MessageRecord[] {
  const rows = selectRecentMessagesStmt.all(limit) as MessageRow[];
  return rows.map(rowToMessage);
}

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------

export interface PlanRecord {
  id: number;
  date: string;
  tracksJson: string;
  say: string;
  segue: string;
  createdAt: number;
}

interface PlanRow {
  id: number;
  date: string;
  tracks_json: string;
  say: string;
  segue: string;
  created_at: number;
}

const insertPlanStmt = db.prepare(`
  INSERT INTO plan (date, tracks_json, say, segue)
  VALUES (@date, @tracksJson, @say, @segue)
`);

const selectPlanByIdStmt = db.prepare(`
  SELECT id, date, tracks_json, say, segue, created_at
  FROM plan
  WHERE id = ?
`);

const selectTodayPlanStmt = db.prepare(`
  SELECT id, date, tracks_json, say, segue, created_at
  FROM plan
  WHERE date = ?
  LIMIT 1
`);

function rowToPlan(row: PlanRow): PlanRecord {
  return {
    id: row.id,
    date: row.date,
    tracksJson: row.tracks_json,
    say: row.say,
    segue: row.segue,
    createdAt: row.created_at,
  };
}

export function savePlan(date: string, tracksJson: string, say: string, segue: string): PlanRecord {
  const result = insertPlanStmt.run({ date, tracksJson, say, segue });
  const row = selectPlanByIdStmt.get(result.lastInsertRowid) as PlanRow;
  return rowToPlan(row);
}

export function getTodayPlan(date: string): PlanRecord | undefined {
  const row = selectTodayPlanStmt.get(date) as PlanRow | undefined;
  return row ? rowToPlan(row) : undefined;
}

// ---------------------------------------------------------------------------
// Prefs
// ---------------------------------------------------------------------------

export interface PrefRecord {
  key: string;
  value: string;
  updatedAt: number;
}

interface PrefRow {
  key: string;
  value: string;
  updated_at: number;
}

const upsertPrefStmt = db.prepare(`
  INSERT OR REPLACE INTO prefs (key, value, updated_at)
  VALUES (@key, @value, @updatedAt)
`);

const selectPrefStmt = db.prepare(`
  SELECT key, value, updated_at
  FROM prefs
  WHERE key = ?
`);

const selectAllPrefsStmt = db.prepare(`
  SELECT key, value, updated_at
  FROM prefs
`);

function rowToPref(row: PrefRow): PrefRecord {
  return {
    key: row.key,
    value: row.value,
    updatedAt: row.updated_at,
  };
}

export function setPref(key: string, value: string): PrefRecord {
  upsertPrefStmt.run({ key, value, updatedAt: Date.now() });
  const row = selectPrefStmt.get(key) as PrefRow;
  return rowToPref(row);
}

export function getPref(key: string): PrefRecord | undefined {
  const row = selectPrefStmt.get(key) as PrefRow | undefined;
  return row ? rowToPref(row) : undefined;
}

export function getAllPrefs(): PrefRecord[] {
  const rows = selectAllPrefsStmt.all() as PrefRow[];
  return rows.map(rowToPref);
}

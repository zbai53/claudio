import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config as loadDotenv } from 'dotenv';

// ESM has no __dirname global, so derive it from import.meta.url.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the project root explicitly. Don't rely on cwd because
// `npm run dev -w server` sets cwd to server/, where .env doesn't live.
loadDotenv({ path: path.resolve(__dirname, '../../.env') });

// `as const` makes this a readonly tuple of literal strings instead of
// `string[]`, giving us precise typing for the keys below.
const REQUIRED_ENV_VARS = [
  'PORT',
  'NODE_ENV',
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'SPOTIFY_REDIRECT_URI',
  'DATABASE_PATH',
] as const;

// Fail fast on startup if any required var is missing. We'd rather crash
// here than discover the problem hours later when an OAuth call fails.
const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}\n` +
      `Check your .env file against .env.example`,
  );
}

// Typed config object. Using `!` is safe here because the fail-fast check
// above guarantees these vars exist at runtime, even though TS still sees
// them as `string | undefined`.
export const config = {
  port: Number(process.env.PORT),
  nodeEnv: process.env.NODE_ENV as 'development' | 'production' | 'test',
  databasePath: process.env.DATABASE_PATH!,
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID!,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI!,
  },
} as const;

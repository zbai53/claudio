import path from 'path';

/**
 * Returns the project root directory.
 *
 * In development, npm workspaces sets cwd to server/, so the root is one
 * level up. In production (Render), the start command runs from the project
 * root directly, so cwd IS the root.
 */
export function projectRoot(): string {
  if (process.env.NODE_ENV === 'production') {
    return process.cwd();
  }
  return path.resolve(process.cwd(), '..');
}

export function dataDir(): string {
  return path.join(projectRoot(), 'data/user');
}

export function promptsDir(): string {
  return path.join(projectRoot(), 'prompts');
}

/**
 * Resolves the SQLite database path.
 *
 * Prefers DATABASE_PATH env var. Absolute paths are used as-is; relative
 * paths are resolved against the project root.
 */
export function dbPath(): string {
  const envPath = process.env.DATABASE_PATH;
  if (envPath) {
    return path.isAbsolute(envPath) ? envPath : path.resolve(projectRoot(), envPath);
  }
  return path.join(projectRoot(), 'data/claudio.db');
}

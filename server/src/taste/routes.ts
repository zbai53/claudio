import { readFile, writeFile } from 'fs/promises';
import path from 'path';

import { Router } from 'express';

export const tasteRouter = Router();

const TASTE_FILES = ['taste.md', 'routines.md', 'mood-rules.md'] as const;
type TasteFile = (typeof TASTE_FILES)[number];

const USER_DATA_DIR = path.resolve(process.cwd(), '../data/user');

function isTasteFile(name: string): name is TasteFile {
  return (TASTE_FILES as readonly string[]).includes(name);
}

tasteRouter.get('/', async (_req, res) => {
  try {
    const files = await Promise.all(
      TASTE_FILES.map(async (name) => {
        const content = await readFile(path.join(USER_DATA_DIR, name), 'utf-8');
        return { name, content };
      }),
    );
    res.json({ files });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[taste] read failed:', message);
    res.status(500).json({ error: { code: 'READ_FAILED', message } });
  }
});

tasteRouter.put('/:filename', async (req, res) => {
  const { filename } = req.params;

  if (!isTasteFile(filename)) {
    res.status(400).json({ error: { code: 'INVALID_FILE', message: `Unknown file: ${filename}` } });
    return;
  }

  const { content } = req.body as { content?: string };
  if (typeof content !== 'string') {
    res.status(400).json({ error: { code: 'MISSING_CONTENT', message: 'content is required' } });
    return;
  }

  try {
    await writeFile(path.join(USER_DATA_DIR, filename), content, 'utf-8');
    res.json({ ok: true, name: filename });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[taste] write failed:', message);
    res.status(500).json({ error: { code: 'WRITE_FAILED', message } });
  }
});

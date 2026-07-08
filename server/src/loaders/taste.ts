import { readFile } from 'fs/promises';
import path from 'path';

const USER_DATA_DIR = path.resolve(process.cwd(), 'data/user');

async function readSection(filename: string, header: string): Promise<string> {
  const filePath = path.join(USER_DATA_DIR, filename);
  try {
    const content = await readFile(filePath, 'utf-8');
    return `## ${header}\n\n${content.trim()}`;
  } catch (err) {
    throw new Error(
      `loadTaste: could not read "${filePath}". Make sure data/user/${filename} exists. (${String(err)})`,
    );
  }
}

export async function loadTaste(): Promise<string> {
  const [taste, routines, moodRules] = await Promise.all([
    readSection('taste.md', 'Taste Profile'),
    readSection('routines.md', 'Daily Routines'),
    readSection('mood-rules.md', 'Mood Rules'),
  ]);

  return [taste, routines, moodRules].join('\n\n---\n\n');
}

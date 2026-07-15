import { readFile } from 'fs/promises';
import path from 'path';

import { loadEnvironment } from '../loaders/environment.js';
import { loadMemory } from '../loaders/memory.js';
import { loadTaste } from '../loaders/taste.js';
import { promptsDir } from '../paths.js';

const PERSONA_PATH = path.join(promptsDir(), 'dj-persona.md');

const INSTRUCTIONS =
  '## Instructions\n\nBased on all context above, pick 3-5 tracks and write your DJ intro. Respond with raw JSON only.';

export async function assembleContext(trigger: string): Promise<string> {
  let persona: string;
  try {
    persona = await readFile(PERSONA_PATH, 'utf-8');
  } catch (err) {
    throw new Error(
      `assembleContext: could not read DJ persona file at "${PERSONA_PATH}". (${String(err)})`,
    );
  }

  const [taste, environment, memory] = await Promise.all([
    loadTaste(),
    loadEnvironment(),
    loadMemory(),
  ]);

  const triggerSection = `## Trigger\n\n${trigger}`;

  return [persona.trim(), taste, environment, memory, triggerSection, INSTRUCTIONS].join(
    '\n\n---\n\n',
  );
}

import { getRecentPlays } from '../state/repository.js';

export async function loadMemory(): Promise<string> {
  const plays = getRecentPlays(20);
  if (plays.length === 0) {
    return '## Recent Listening History\n\nNo tracks played yet.';
  }
  return (
    '## Recent Listening History\n\n' +
    plays
      .map((p) => `- ${p.artistName} — ${p.trackName} (${new Date(p.createdAt).toLocaleString()})`)
      .join('\n')
  );
}

import cron from 'node-cron';

import { createBrain } from '../brain/index.js';
import { assembleContext } from '../context/assemble.js';
import { resolvePlaylist } from '../spotify/search.js';
import { savePlan } from '../state/repository.js';

const brain = createBrain();

async function runMorningPlan(): Promise<void> {
  console.log(`[scheduler] morning plan triggered at ${new Date().toISOString()}`);
  const prompt = await assembleContext('morning plan: build today playlist');
  const response = await brain.invoke(prompt);
  const tracks = await resolvePlaylist(response.play);
  const todayDate = new Date().toISOString().slice(0, 10);
  savePlan(todayDate, JSON.stringify(tracks), response.say, response.segue);
  console.log('[scheduler] morning plan saved:', todayDate);
}

async function runMorningBrief(): Promise<void> {
  console.log(`[scheduler] morning brief triggered at ${new Date().toISOString()}`);
  const prompt = await assembleContext(
    'morning briefing: greet the user and introduce today playlist',
  );
  const response = await brain.invoke(prompt);
  // Phase 5: push to WebSocket. For now just log.
  console.log('[scheduler] morning brief:', response.say);
}

async function runMoodCheck(): Promise<void> {
  console.log(`[scheduler] mood check triggered at ${new Date().toISOString()}`);
  const prompt = await assembleContext('hourly mood check: should the playlist change?');
  const response = await brain.invoke(prompt);
  // Phase 5: trigger playlist adjustments. For now just log.
  console.log('[scheduler] mood check:', response.reason);
}

export function startScheduler(): void {
  // Morning plan — 7:00 AM every day
  cron.schedule('0 7 * * *', () => {
    runMorningPlan().catch((err) => console.error('[scheduler] morning plan failed:', err));
  });

  // Morning brief — 9:00 AM every day
  cron.schedule('0 9 * * *', () => {
    runMorningBrief().catch((err) => console.error('[scheduler] morning brief failed:', err));
  });

  // Hourly mood check — every hour from 10 AM to 10 PM
  cron.schedule('0 10-22 * * *', () => {
    runMoodCheck().catch((err) => console.error('[scheduler] mood check failed:', err));
  });
}

export async function triggerManually(job: 'plan' | 'brief' | 'mood'): Promise<void> {
  if (job === 'plan') return runMorningPlan();
  if (job === 'brief') return runMorningBrief();
  return runMoodCheck();
}

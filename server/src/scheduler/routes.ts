import { Router } from 'express';

import { triggerManually } from './index.js';

export const schedulerRouter = Router();

const VALID_JOBS = ['plan', 'brief', 'mood'] as const;
type Job = (typeof VALID_JOBS)[number];

schedulerRouter.post('/trigger', async (req, res) => {
  const { job } = req.body as { job: unknown };

  if (!VALID_JOBS.includes(job as Job)) {
    res.status(400).json({
      error: { code: 'INVALID_JOB', message: `job must be one of: ${VALID_JOBS.join(', ')}` },
    });
    return;
  }

  try {
    await triggerManually(job as Job);
    res.status(200).json({ ok: true, job });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[scheduler] trigger failed:', message);
    res.status(500).json({ error: { code: 'SCHEDULER_TRIGGER_FAILED', message } });
  }
});

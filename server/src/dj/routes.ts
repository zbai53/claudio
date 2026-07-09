import { Router } from 'express';

import { createBrain } from '../brain/index.js';
import { assembleContext } from '../context/assemble.js';
import { resolvePlaylist } from '../spotify/search.js';
import { broadcast } from '../ws/index.js';

// Brain is created once at module load so BRAIN_MODE is validated at startup
// (fail fast) rather than on the first request.
const brain = createBrain();

export const djRouter = Router();

djRouter.post('/invoke', async (req, res) => {
  const trigger: string = req.body?.trigger ?? 'manual invoke';

  try {
    const prompt = await assembleContext(trigger);
    const response = await brain.invoke(prompt);
    const tracks = await resolvePlaylist(response.play);
    broadcast({ type: 'dj', say: response.say, segue: response.segue });
    res.status(200).json({ ...response, tracks });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[dj] invoke failed:', message);
    res.status(500).json({ error: { code: 'DJ_INVOKE_FAILED', message } });
  }
});

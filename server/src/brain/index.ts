import { ApiBrain } from './api.js';
import { SubprocessBrain } from './subprocess.js';
import type { Brain, BrainResponse } from './types.js';

export type { Brain, BrainResponse };

/**
 * Factory that reads BRAIN_MODE from the environment and returns the
 * appropriate Brain adapter.
 *
 * 'subprocess' — Claude Code CLI, zero API cost, requires local install
 * 'api'        — Anthropic API, costs ~$0.005/call, works anywhere
 *
 * Fail fast on unknown values so misconfiguration is caught at startup,
 * not silently at the first invoke() call.
 */
export function createBrain(): Brain {
  const mode = process.env['BRAIN_MODE'];

  if (mode === 'subprocess') {
    return new SubprocessBrain();
  }

  if (mode === 'api') {
    return new ApiBrain();
  }

  throw new Error(`createBrain: unknown BRAIN_MODE "${mode}". Expected "subprocess" or "api".`);
}

import { describe, expect, it } from 'vitest';
import { BrainResponseSchema } from './types.js';
import { SubprocessBrain } from './subprocess.js';
import { ApiBrain } from './api.js';
import { createBrain } from './index.js';

// ---------------------------------------------------------------------------
// BrainResponseSchema
// ---------------------------------------------------------------------------

describe('BrainResponseSchema', () => {
  it('accepts a valid BrainResponse', () => {
    const input = {
      say: 'Good morning, here is your playlist.',
      play: ['Burial Archangel', 'Four Tet She Moves She'],
      reason: 'Rainy Monday morning, user prefers ambient on slow days.',
      segue: 'More coming up after this.',
    };

    const result = BrainResponseSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('rejects a response with missing say field', () => {
    const input = {
      play: ['Burial Archangel'],
      reason: 'test',
      segue: 'test',
    };

    const result = BrainResponseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects a response where play is not an array', () => {
    const input = {
      say: 'hello',
      play: 'Burial Archangel', // string instead of array
      reason: 'test',
      segue: 'test',
    };

    const result = BrainResponseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects a response where play contains non-strings', () => {
    const input = {
      say: 'hello',
      play: [1, 2, 3], // numbers instead of strings
      reason: 'test',
      segue: 'test',
    };

    const result = BrainResponseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects a non-object response', () => {
    const result = BrainResponseSchema.safeParse('not an object');
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createBrain factory
// ---------------------------------------------------------------------------

describe('createBrain', () => {
  it('returns SubprocessBrain when BRAIN_MODE is subprocess', () => {
    process.env['BRAIN_MODE'] = 'subprocess';
    const brain = createBrain();
    expect(brain).toBeInstanceOf(SubprocessBrain);
  });

  it('returns ApiBrain when BRAIN_MODE is api', () => {
    process.env['BRAIN_MODE'] = 'api';
    const brain = createBrain();
    expect(brain).toBeInstanceOf(ApiBrain);
  });

  it('throws on unknown BRAIN_MODE', () => {
    process.env['BRAIN_MODE'] = 'invalid';
    expect(() => createBrain()).toThrow('unknown BRAIN_MODE');
  });

  it('throws when BRAIN_MODE is not set', () => {
    delete process.env['BRAIN_MODE'];
    expect(() => createBrain()).toThrow('unknown BRAIN_MODE');
  });
});

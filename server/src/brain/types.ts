import { z } from 'zod';

/**
 * Zod schema for the structured response every Brain implementation
 * must return. Single source of truth for both runtime validation and
 * the TypeScript type — derived with z.infer so they never drift apart.
 *
 * say    — the DJ intro text, spoken aloud before the first track
 * play   — ordered list of track search queries (e.g. "Burial Archangel")
 *           resolved against Spotify search in Phase 3
 * reason — internal justification, never shown to the user; used for
 *           debugging and to give the model a scratchpad to think before
 *           committing to say/play
 * segue  — one-line bridge to the next segment, spoken after the last track
 */
export const BrainResponseSchema = z.object({
  say: z.string(),
  play: z.array(z.string()),
  reason: z.string(),
  segue: z.string(),
});

/**
 * Derived from the schema — type and validation always in sync.
 * Previously a hand-written interface; now inferred from BrainResponseSchema
 * so adding a field to the schema automatically updates the type.
 */
export type BrainResponse = z.infer<typeof BrainResponseSchema>;

/**
 * Strip markdown code fences from raw LLM output before JSON.parse.
 *
 * Claude occasionally wraps its response in ```json ... ``` even when
 * instructed not to. This function removes the opening fence line
 * (```json or ```) and the closing ``` so JSON.parse can succeed.
 */
export function stripFences(raw: string): string {
  let s = raw.trim();
  // Remove opening fence line (```json or ```, with optional trailing whitespace)
  s = s.replace(/^```(?:json)?\s*\n?/, '');
  // Remove closing fence
  s = s.replace(/\n?```\s*$/, '');
  return s.trim();
}

/**
 * The contract every Brain adapter must satisfy.
 *
 * invoke() takes a fully-assembled prompt string and returns a parsed,
 * validated BrainResponse. Callers never deal with raw LLM output —
 * parsing and validation happen inside the adapter.
 *
 * Implementations: SubprocessBrain (Phase 2), ApiBrain (Phase 2).
 */
export interface Brain {
  invoke(prompt: string): Promise<BrainResponse>;
}

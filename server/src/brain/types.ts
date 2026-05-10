/**
 * The structured response every Brain implementation must return.
 *
 * say    — the DJ intro text, spoken aloud before the first track
 * play   — ordered list of track search queries (e.g. "Burial Archangel")
 *           resolved against Spotify search in Phase 3
 * reason — internal justification, never shown to the user; used for
 *           debugging and to give the model a scratchpad to think before
 *           committing to say/play
 * segue  — one-line bridge to the next segment, spoken after the last track
 */
export interface BrainResponse {
  say: string;
  play: string[];
  reason: string;
  segue: string;
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

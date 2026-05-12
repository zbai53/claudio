import { spawn } from 'child_process';
import { Brain, BrainResponse, BrainResponseSchema } from './types.js';

/**
 * Invokes the Claude Code CLI as a subprocess and parses its stdout
 * as a BrainResponse JSON object.
 *
 * Used in local development where Claude Code is available via the
 * Pro/Max subscription — zero API cost compared to ApiBrain.
 *
 * The prompt must instruct the model to respond with raw JSON only
 * (no markdown fences, no preamble). Enforced in context/assemble.ts.
 */
export class SubprocessBrain implements Brain {
  async invoke(prompt: string): Promise<BrainResponse> {
    const raw = await this.runClaude(prompt);
    return this.parse(raw);
  }

  private runClaude(prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // -p flag: non-interactive "pipe" mode — reads from stdin,
      // writes response to stdout, then exits. No interactive UI.
      const child = spawn('claude', ['-p'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      child.on('close', (code: number | null) => {
        if (code !== 0) {
          reject(new Error(`claude subprocess exited with code ${code}. stderr: ${stderr.trim()}`));
          return;
        }
        resolve(stdout);
      });

      child.on('error', (err: Error) => {
        // Fires if the claude binary is not found or cannot be spawned.
        reject(new Error(`failed to spawn claude subprocess: ${err.message}`));
      });

      // Write the prompt to stdin and close the stream so claude knows
      // input is complete and can begin processing.
      child.stdin.write(prompt);
      child.stdin.end();
    });
  }

  private parse(raw: string): BrainResponse {
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw.trim());
    } catch {
      throw new Error(
        `SubprocessBrain: claude output is not valid JSON.\nRaw output: ${raw.slice(0, 200)}`,
      );
    }

    // Zod validates shape and types, throws ZodError with field-level
    // detail if anything is missing or wrong.
    const result = BrainResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `SubprocessBrain: response does not match BrainResponse schema.\n${result.error.message}`,
      );
    }

    return result.data;
  }
}

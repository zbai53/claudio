import Anthropic from '@anthropic-ai/sdk';
import { Brain, BrainResponse, BrainResponseSchema } from './types.js';

/**
 * Invokes the Anthropic API directly and parses the response as
 * a BrainResponse JSON object.
 *
 * Used in production where Claude Code subprocess is not available.
 * Costs ~$0.005 per invocation with claude-haiku-4-5 — stay within
 * the $5/month cap set in the Anthropic Console.
 *
 * The prompt must instruct the model to respond with raw JSON only
 * (no markdown fences, no preamble). Enforced in context/assemble.ts.
 */
export class ApiBrain implements Brain {
  private client: Anthropic;
  private model: string;

  constructor() {
    // Anthropic SDK reads ANTHROPIC_API_KEY from the environment
    // automatically — no need to pass it explicitly.
    this.client = new Anthropic();

    // Model is configurable via env so we can swap haiku ↔ sonnet
    // without a code change (e.g. for a higher-quality demo).
    this.model = process.env['ANTHROPIC_MODEL'] ?? 'claude-haiku-4-5';
  }

  async invoke(prompt: string): Promise<BrainResponse> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = this.extractText(message);
    return this.parse(raw);
  }

  private extractText(message: Anthropic.Message): string {
    // The API response may contain multiple content blocks.
    // We only care about the first text block — the JSON response.
    const block = message.content.find((b) => b.type === 'text');

    if (!block || block.type !== 'text') {
      throw new Error('ApiBrain: response contained no text block');
    }

    return block.text;
  }

  private parse(raw: string): BrainResponse {
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw.trim());
    } catch {
      throw new Error(`ApiBrain: response is not valid JSON.\nRaw output: ${raw.slice(0, 200)}`);
    }

    const result = BrainResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `ApiBrain: response does not match BrainResponse schema.\n${result.error.message}`,
      );
    }

    return result.data;
  }
}

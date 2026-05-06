import { createHash, randomBytes } from 'node:crypto';

/**
 * PKCE (Proof Key for Code Exchange) helpers for OAuth 2.0.
 *
 * Spec: https://datatracker.ietf.org/doc/html/rfc7636
 * Spotify: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
 */

/**
 * Generate a high-entropy code_verifier per RFC 7636 §4.1.
 *
 * The spec requires 43-128 chars from [A-Z][a-z][0-9]-._~. We use 32
 * random bytes encoded as base64url, which yields 43 chars and 256 bits
 * of entropy — well above the spec minimum.
 */
export function generateCodeVerifier(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Derive the code_challenge from a verifier using SHA-256.
 *
 * Spotify only accepts the S256 method (not the plain method). The
 * challenge is the base64url-encoded SHA-256 hash of the verifier.
 */
export function generateCodeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

/**
 * Generate a random state parameter for CSRF protection.
 *
 * The state is opaque to Spotify — it's round-tripped back to /callback
 * unchanged. We compare it against what we stored to verify the callback
 * is for a request we initiated.
 */
export function generateState(): string {
  return randomBytes(32).toString('base64url');
}

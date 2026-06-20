/** Symbol-keyed global so the token is a singleton across bundled module copies in one process. */
const WARMUP_TOKEN_KEY = Symbol.for('marco.cache.warmup.internal-token');

const WARMUP_TOKEN_BYTE_LENGTH = 32;

function createRandomHexToken(): string {
  const bytes = new Uint8Array(WARMUP_TOKEN_BYTE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

type GlobalWithWarmupToken = typeof globalThis & {
  [WARMUP_TOKEN_KEY]?: string;
};

/**
 * Per-process random token shared between the instrumentation loopback trigger and
 * the warm-up route handler (both run in the same Node server process for standalone
 * deployments). External callers cannot know it, so it authorizes the internal warm
 * request without depending on the bind host (`0.0.0.0` in containers breaks the
 * loopback host check) and without requiring an operator-provided secret.
 */
export function getWarmupInternalToken(): string {
  const globalScope = globalThis as GlobalWithWarmupToken;
  let token = globalScope[WARMUP_TOKEN_KEY];
  if (!token) {
    token = createRandomHexToken();
    globalScope[WARMUP_TOKEN_KEY] = token;
  }
  return token;
}

/** Header carrying the per-process warm-up token on the internal loopback request. */
export const WARMUP_INTERNAL_TOKEN_HEADER = 'x-warmup-token';

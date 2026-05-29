/**
 * Next.js instrumentation — runs once per server cold start.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */
export async function register(): Promise<void> {
  /**
   * Keep instrumentation side-effect free.
   * Startup cache warm-up was moved out of this hook because it pulls server-only
   * dependencies into build contexts where Node builtins are unavailable.
   */
  return;
}

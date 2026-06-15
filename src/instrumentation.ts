/**
 * Next.js instrumentation — runs once per server cold start.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'edge') {
    return;
  }

  const { reportJwtSecretConfiguration } = await import('./lib/config/jwt-secret-guard');
  reportJwtSecretConfiguration();
}

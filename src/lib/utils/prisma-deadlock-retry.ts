const POSTGRES_DEADLOCK_CODE = '40P01';
const DEFAULT_MAX_DEADLOCK_RETRIES = 3;
const DEADLOCK_RETRY_BASE_MS = 100;

/**
 * Detects PostgreSQL deadlock errors surfaced by Prisma batch/transaction calls.
 */
function isPrismaDeadlockError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('deadlock detected') ||
    message.includes(POSTGRES_DEADLOCK_CODE)
  );
}

/**
 * Retries transient PostgreSQL deadlocks with exponential backoff.
 */
export async function runWithDeadlockRetry<T>(
  operation: () => Promise<T>,
  maxRetries = DEFAULT_MAX_DEADLOCK_RETRIES,
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error: unknown) {
      if (!isPrismaDeadlockError(error) || attempt >= maxRetries) {
        throw error;
      }

      attempt += 1;
      const jitterMs = Math.floor(Math.random() * 50);
      const delayMs = DEADLOCK_RETRY_BASE_MS * 2 ** (attempt - 1) + jitterMs;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

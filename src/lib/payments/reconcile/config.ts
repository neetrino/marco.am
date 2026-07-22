/**
 * Env-driven timing for pending payment reconciliation.
 * Cron schedule itself lives in vercel.json and should match intervalMinutes.
 */

const DEFAULT_INTERVAL_MINUTES = 5;
const DEFAULT_TIMEOUT_MINUTES = 60;
const DEFAULT_BATCH_SIZE = 25;

const MIN_INTERVAL_MINUTES = 1;
const MAX_INTERVAL_MINUTES = 60;
const MIN_TIMEOUT_MINUTES = 1;
const MAX_TIMEOUT_MINUTES = 24 * 60;
const MIN_BATCH_SIZE = 1;
const MAX_BATCH_SIZE = 100;

export type PaymentReconcileConfig = {
  /** How often the cron is expected to run (minutes). */
  intervalMinutes: number;
  /** After this age, still-pending payments are marked failed. */
  timeoutMinutes: number;
  /** Max payments processed per cron invocation. */
  batchSize: number;
};

function parsePositiveInt(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }
  const value = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(value) || value < min || value > max) {
    return fallback;
  }
  return value;
}

/**
 * Resolves reconcile timing from env with safe defaults and bounds.
 */
export function resolvePaymentReconcileConfig(): PaymentReconcileConfig {
  return {
    intervalMinutes: parsePositiveInt(
      process.env.PAYMENT_RECONCILE_INTERVAL_MINUTES,
      DEFAULT_INTERVAL_MINUTES,
      MIN_INTERVAL_MINUTES,
      MAX_INTERVAL_MINUTES,
    ),
    timeoutMinutes: parsePositiveInt(
      process.env.PAYMENT_PENDING_TIMEOUT_MINUTES,
      DEFAULT_TIMEOUT_MINUTES,
      MIN_TIMEOUT_MINUTES,
      MAX_TIMEOUT_MINUTES,
    ),
    batchSize: parsePositiveInt(
      process.env.PAYMENT_RECONCILE_BATCH_SIZE,
      DEFAULT_BATCH_SIZE,
      MIN_BATCH_SIZE,
      MAX_BATCH_SIZE,
    ),
  };
}

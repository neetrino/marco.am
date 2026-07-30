/**
 * Static timing for pending payment reconciliation.
 * Cron schedule lives in vercel.json (every 30 minutes).
 */

/** After this age, still-pending payments are marked failed. */
export const PAYMENT_RECONCILE_TIMEOUT_MINUTES = 60;

/** Max payments processed per cron invocation. */
export const PAYMENT_RECONCILE_BATCH_SIZE = 25;

export type PaymentReconcileConfig = {
  timeoutMinutes: number;
  batchSize: number;
};

/**
 * Returns reconcile timing constants (not env-driven).
 */
export function resolvePaymentReconcileConfig(): PaymentReconcileConfig {
  return {
    timeoutMinutes: PAYMENT_RECONCILE_TIMEOUT_MINUTES,
    batchSize: PAYMENT_RECONCILE_BATCH_SIZE,
  };
}

/**
 * Classifies ArCa / SmartVista orderStatus + paymentState for reconciliation.
 * Bank is source of truth; URL params must never drive this.
 *
 * Typical orderStatus:
 * 0 registered, 1 hold, 2 deposited (paid), 3 reversed, 4 refunded, 5 ACS, 6 declined.
 */

export type ArcaReconcileOutcome = "paid" | "failed" | "pending";

export type ArcaStatusSnapshot = {
  orderStatus: number | null;
  paymentState: string | null;
  isPaid: boolean;
};

const TERMINAL_FAILURE_ORDER_STATUSES = new Set([3, 6]);
const TERMINAL_FAILURE_PAYMENT_STATES = new Set([
  "DECLINED",
  "REVERSED",
  "REJECTED",
  "CANCELLED",
  "CANCELED",
]);

/**
 * Maps bank status to reconcile action. Non-terminal non-paid stays pending.
 */
export function classifyArcaReconcileOutcome(
  status: ArcaStatusSnapshot,
): ArcaReconcileOutcome {
  if (status.isPaid) {
    return "paid";
  }

  if (
    status.orderStatus !== null &&
    TERMINAL_FAILURE_ORDER_STATUSES.has(status.orderStatus)
  ) {
    return "failed";
  }

  const state = status.paymentState?.trim().toUpperCase() ?? "";
  if (state && TERMINAL_FAILURE_PAYMENT_STATES.has(state)) {
    return "failed";
  }

  return "pending";
}

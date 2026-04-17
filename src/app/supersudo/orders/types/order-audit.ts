/**
 * Admin order detail — audit trail item (mirrors API `auditTrail` from GET admin order).
 */
export type OrderAuditEntry = {
  id: string;
  type: string;
  createdAt: string;
  data: unknown;
  actor: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
};

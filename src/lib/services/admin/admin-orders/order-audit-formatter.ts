import type { Prisma } from "@white-shop/db/prisma";

/** Actor snapshot for admin order audit entries (from `users`). */
export type OrderAuditActor = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

/**
 * Single audit entry for an order timeline (`order_events`).
 */
export type OrderAuditEntry = {
  id: string;
  type: string;
  createdAt: string;
  data: Prisma.JsonValue | null;
  actor: OrderAuditActor | null;
};

/**
 * Maps `OrderEvent` rows to API `auditTrail` items with ISO timestamps and optional actor.
 */
export function formatOrderAuditTrail(
  events: Array<{
    id: string;
    type: string;
    data: Prisma.JsonValue | null;
    userId: string | null;
    createdAt: Date;
  }>,
  actorsById: Record<string, OrderAuditActor>
): OrderAuditEntry[] {
  return events.map((e) => ({
    id: e.id,
    type: e.type,
    createdAt: e.createdAt.toISOString(),
    data: e.data ?? null,
    actor:
      e.userId && actorsById[e.userId] !== undefined
        ? actorsById[e.userId]!
        : null,
  }));
}

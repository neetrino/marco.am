import type { OrderAuditEntry } from "../types/order-audit";

function interpolate(
  template: string,
  vars: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const token = `{${key}}`;
    result = result.split(token).join(value);
  }
  return result;
}

/**
 * Human-readable lines for an order audit entry (status history / timestamps).
 */
export function getAuditDetailLines(
  entry: OrderAuditEntry,
  t: (path: string) => string
): string[] {
  const data = entry.data;

  if (entry.type === "order_created") {
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const raw = data as { source?: string };
      const source = typeof raw.source === "string" ? raw.source : "—";
      return [
        interpolate(t("admin.orders.orderDetails.auditTrail.orderCreated"), {
          source,
        }),
      ];
    }
    return [t("admin.orders.orderDetails.auditTrail.orderCreatedFallback")];
  }

  if (entry.type === "order_updated") {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return [t("admin.orders.orderDetails.auditTrail.updatedUnknown")];
    }
    const d = data as {
      changes?: {
        status?: { from: string; to: string };
        paymentStatus?: { from: string; to: string };
        fulfillmentStatus?: { from: string; to: string };
        adminNotes?: { from: string | null; to: string | null };
      };
      previousStatus?: string;
      newStatus?: string;
    };
    const lines: string[] = [];
    if (d.changes?.status) {
      lines.push(
        interpolate(t("admin.orders.orderDetails.auditTrail.changeStatus"), {
          from: d.changes.status.from,
          to: d.changes.status.to,
        })
      );
    }
    if (d.changes?.paymentStatus) {
      lines.push(
        interpolate(t("admin.orders.orderDetails.auditTrail.changePayment"), {
          from: d.changes.paymentStatus.from,
          to: d.changes.paymentStatus.to,
        })
      );
    }
    if (d.changes?.fulfillmentStatus) {
      lines.push(
        interpolate(
          t("admin.orders.orderDetails.auditTrail.changeFulfillment"),
          {
            from: d.changes.fulfillmentStatus.from,
            to: d.changes.fulfillmentStatus.to,
          }
        )
      );
    }
    if (d.changes?.adminNotes) {
      lines.push(
        interpolate(t("admin.orders.orderDetails.auditTrail.changeInternalNotes"), {
          from: d.changes.adminNotes.from ?? "—",
          to: d.changes.adminNotes.to ?? "—",
        })
      );
    }
    if (
      lines.length === 0 &&
      d.previousStatus !== undefined &&
      d.newStatus !== undefined
    ) {
      lines.push(
        interpolate(t("admin.orders.orderDetails.auditTrail.changeStatus"), {
          from: d.previousStatus,
          to: d.newStatus,
        })
      );
    }
    if (lines.length > 0) {
      return lines;
    }
    return [t("admin.orders.orderDetails.auditTrail.updatedUnknown")];
  }

  return [
    interpolate(t("admin.orders.orderDetails.auditTrail.genericEvent"), {
      type: entry.type,
    }),
  ];
}

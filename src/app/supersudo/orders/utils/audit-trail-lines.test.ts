import { describe, expect, it } from "vitest";
import { getAuditDetailLines } from "./audit-trail-lines";
import type { OrderAuditEntry } from "../types/order-audit";

describe("getAuditDetailLines", () => {
  const t = (path: string) => {
    const map: Record<string, string> = {
      "admin.orders.orderDetails.auditTrail.orderCreated":
        "Order created ({source})",
      "admin.orders.orderDetails.auditTrail.orderCreatedFallback":
        "Order created",
      "admin.orders.orderDetails.auditTrail.changeStatus":
        "Status: {from} → {to}",
      "admin.orders.orderDetails.auditTrail.changePayment":
        "Payment: {from} → {to}",
      "admin.orders.orderDetails.auditTrail.changeFulfillment":
        "Fulfillment: {from} → {to}",
      "admin.orders.orderDetails.auditTrail.updatedUnknown": "Updated",
      "admin.orders.orderDetails.auditTrail.genericEvent": "Event {type}",
    };
    return map[path] ?? path;
  };

  it("describes order_created with source", () => {
    const entry: OrderAuditEntry = {
      id: "1",
      type: "order_created",
      createdAt: "",
      data: { source: "user" },
      actor: null,
    };
    expect(getAuditDetailLines(entry, t)).toEqual([
      "Order created (user)",
    ]);
  });

  it("describes order_updated changes", () => {
    const entry: OrderAuditEntry = {
      id: "2",
      type: "order_updated",
      createdAt: "",
      data: {
        changes: {
          status: { from: "pending", to: "processing" },
        },
      },
      actor: null,
    };
    expect(getAuditDetailLines(entry, t)).toEqual([
      "Status: pending → processing",
    ]);
  });
});

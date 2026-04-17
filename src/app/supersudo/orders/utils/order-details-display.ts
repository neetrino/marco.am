import type { OrderDetails } from "../useOrders";

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return null;
}

function str(r: Record<string, unknown> | null, key: string): string | undefined {
  if (!r) return undefined;
  const v = r[key];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/**
 * Resolves guest checkout name and contact from user row + persisted address JSON.
 */
export function getOrderCustomerDisplay(order: OrderDetails): {
  displayName: string;
  email: string | undefined;
  phone: string | undefined;
  userId: string | undefined;
} {
  const u = order.customer;
  const bill = asRecord(order.billingAddress);
  const ship = asRecord(order.shippingAddress);

  const nameFromUser =
    u && (u.firstName || u.lastName)
      ? [u.firstName ?? "", u.lastName ?? ""]
          .map((s) => s.trim())
          .filter(Boolean)
          .join(" ")
          .trim()
      : "";

  const nameFromBill = [str(bill, "firstName"), str(bill, "lastName")]
    .filter(Boolean)
    .join(" ")
    .trim();

  const nameFromShip = [str(ship, "firstName"), str(ship, "lastName")]
    .filter(Boolean)
    .join(" ")
    .trim();

  const displayName = nameFromUser || nameFromBill || nameFromShip;

  const email = order.customerEmail?.trim() || u?.email?.trim() || str(bill, "email");
  const phone =
    order.customerPhone?.trim() ||
    u?.phone?.trim() ||
    str(bill, "phone") ||
    str(ship, "phone") ||
    str(ship, "shippingPhone");

  return {
    displayName,
    email: email || undefined,
    phone: phone || undefined,
    userId: u?.id,
  };
}

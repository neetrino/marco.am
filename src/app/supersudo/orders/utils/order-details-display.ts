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

type OrderShippingDisplay = {
  methodId: "courier" | "pickup" | "unknown";
  addressLine?: string;
  city?: string;
  phone?: string;
};

export function getOrderShippingDisplay(order: OrderDetails): OrderShippingDisplay {
  const ship = asRecord(order.shippingAddress);
  const method = order.shippingMethod?.trim().toLowerCase();

  let methodId: OrderShippingDisplay["methodId"] = "unknown";
  if (method === "courier" || method === "delivery") {
    methodId = "courier";
  } else if (method === "pickup") {
    methodId = "pickup";
  }

  const addressLine =
    str(ship, "addressLine1") ??
    str(ship, "address") ??
    (methodId === "pickup" ? str(ship, "pickupBranchId") : undefined);

  return {
    methodId,
    addressLine,
    city: str(ship, "city"),
    phone:
      str(ship, "phone") ??
      str(ship, "shippingPhone") ??
      order.customerPhone?.trim() ??
      undefined,
  };
}

export function getPaymentMethodLabel(order: OrderDetails): string {
  return order.payment?.method?.trim() || order.payment?.provider?.trim() || "cash";
}

export function isCashPaymentMethodLabel(method: string): boolean {
  return method.toLowerCase() === "cash";
}

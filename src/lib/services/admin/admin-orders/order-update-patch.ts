import type { UpdateOrderData } from "./types";

const VALID_STATUSES = [
  "pending",
  "processing",
  "completed",
  "cancelled",
] as const;

const VALID_PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
] as const;

const VALID_FULFILLMENT_STATUSES = [
  "unfulfilled",
  "fulfilled",
  "shipped",
  "delivered",
] as const;

/**
 * Throws RFC7807-shaped errors when payload values are invalid.
 */
export function assertValidOrderUpdateData(data: UpdateOrderData): void {
  if (
    data.status !== undefined &&
    !VALID_STATUSES.includes(
      data.status as (typeof VALID_STATUSES)[number]
    )
  ) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
    };
  }

  if (
    data.paymentStatus !== undefined &&
    !VALID_PAYMENT_STATUSES.includes(
      data.paymentStatus as (typeof VALID_PAYMENT_STATUSES)[number]
    )
  ) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: `Invalid paymentStatus. Must be one of: ${VALID_PAYMENT_STATUSES.join(", ")}`,
    };
  }

  if (
    data.fulfillmentStatus !== undefined &&
    !VALID_FULFILLMENT_STATUSES.includes(
      data.fulfillmentStatus as (typeof VALID_FULFILLMENT_STATUSES)[number]
    )
  ) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: `Invalid fulfillmentStatus. Must be one of: ${VALID_FULFILLMENT_STATUSES.join(", ")}`,
    };
  }
}

type OrderScalars = {
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  adminNotes: string | null;
};

export type OrderUpdatePatch = {
  updateData: {
    status?: string;
    paymentStatus?: string;
    fulfillmentStatus?: string;
    adminNotes?: string | null;
    fulfilledAt?: Date;
    cancelledAt?: Date;
    paidAt?: Date;
  };
  changes: {
    status?: { from: string; to: string };
    paymentStatus?: { from: string; to: string };
    fulfillmentStatus?: { from: string; to: string };
    adminNotes?: { from: string | null; to: string | null };
  };
};

const MAX_ADMIN_NOTES_LENGTH = 4000;

function normalizeAdminNotes(
  value: string | null | undefined
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Builds Prisma update payload and change log only for fields that actually differ.
 */
export function buildOrderUpdatePatch(
  existing: OrderScalars,
  data: UpdateOrderData
): OrderUpdatePatch | null {
  const updateData: OrderUpdatePatch["updateData"] = {};
  const changes: OrderUpdatePatch["changes"] = {};

  if (data.status !== undefined && data.status !== existing.status) {
    updateData.status = data.status;
    changes.status = { from: existing.status, to: data.status };
    if (data.status === "completed" && existing.status !== "completed") {
      updateData.fulfilledAt = new Date();
    }
    if (data.status === "cancelled" && existing.status !== "cancelled") {
      updateData.cancelledAt = new Date();
    }
  }

  if (
    data.paymentStatus !== undefined &&
    data.paymentStatus !== existing.paymentStatus
  ) {
    updateData.paymentStatus = data.paymentStatus;
    changes.paymentStatus = {
      from: existing.paymentStatus,
      to: data.paymentStatus,
    };
    if (data.paymentStatus === "paid" && existing.paymentStatus !== "paid") {
      updateData.paidAt = new Date();
    }
  }

  if (
    data.fulfillmentStatus !== undefined &&
    data.fulfillmentStatus !== existing.fulfillmentStatus
  ) {
    updateData.fulfillmentStatus = data.fulfillmentStatus;
    changes.fulfillmentStatus = {
      from: existing.fulfillmentStatus,
      to: data.fulfillmentStatus,
    };
  }

  if (data.adminNotes !== undefined) {
    const nextAdminNotes = normalizeAdminNotes(data.adminNotes);
    const currentAdminNotes = normalizeAdminNotes(existing.adminNotes);
    if (nextAdminNotes !== currentAdminNotes) {
      updateData.adminNotes = nextAdminNotes ?? null;
      changes.adminNotes = {
        from: currentAdminNotes ?? null,
        to: nextAdminNotes ?? null,
      };
    }
  }

  if (Object.keys(updateData).length === 0) {
    return null;
  }

  return { updateData, changes };
}

/**
 * Throws RFC7807-shaped errors when admin notes exceed safe limits.
 */
export function assertValidAdminNotesUpdate(data: UpdateOrderData): void {
  if (data.adminNotes === undefined || data.adminNotes === null) {
    return;
  }
  if (typeof data.adminNotes !== "string") {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "Invalid adminNotes. Must be a string or null.",
    };
  }
  if (data.adminNotes.length > MAX_ADMIN_NOTES_LENGTH) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: `adminNotes is too long. Max length is ${MAX_ADMIN_NOTES_LENGTH} characters.`,
    };
  }
}

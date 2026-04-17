import { normalizeCheckoutPaymentMethod } from "@/lib/constants/checkout-payment-method";

type OrderStatus = "pending" | "processing" | "completed" | "cancelled";
type OrderPaymentStatus = "pending" | "paid" | "failed" | "refunded";

type CashFlowInput = {
  paymentMethod?: string | null;
  paymentProvider?: string | null;
  requestedStatus?: string;
  requestedPaymentStatus?: string;
  existingPaymentStatus: string;
};

type CashPaymentPatch = {
  status: string;
  completedAt?: Date | null;
  failedAt?: Date | null;
};

const CASH_STATUS_FALLBACKS: Readonly<Record<OrderStatus, OrderPaymentStatus>> = {
  pending: "pending",
  processing: "pending",
  completed: "paid",
  cancelled: "failed",
};

function asOrderStatus(value: string | undefined): OrderStatus | null {
  if (value === "pending" || value === "processing" || value === "completed" || value === "cancelled") {
    return value;
  }
  return null;
}

function asOrderPaymentStatus(value: string | undefined): OrderPaymentStatus | null {
  if (value === "pending" || value === "paid" || value === "failed" || value === "refunded") {
    return value;
  }
  return null;
}

export function isCashPaymentMethod(methodOrProvider: string | null | undefined): boolean {
  if (!methodOrProvider) {
    return false;
  }
  return normalizeCheckoutPaymentMethod(methodOrProvider) === "cash";
}

export function resolveCashOrderPaymentStatus(input: CashFlowInput): string | undefined {
  const paymentMethod = input.paymentMethod ?? input.paymentProvider ?? null;
  if (!isCashPaymentMethod(paymentMethod)) {
    return input.requestedPaymentStatus;
  }

  const explicitPaymentStatus = asOrderPaymentStatus(input.requestedPaymentStatus);
  if (explicitPaymentStatus) {
    return explicitPaymentStatus;
  }

  const nextOrderStatus = asOrderStatus(input.requestedStatus);
  if (!nextOrderStatus) {
    return input.requestedPaymentStatus;
  }

  const currentOrderPaymentStatus = asOrderPaymentStatus(input.existingPaymentStatus);
  const fallbackStatus = CASH_STATUS_FALLBACKS[nextOrderStatus];
  if (fallbackStatus === currentOrderPaymentStatus) {
    return input.requestedPaymentStatus;
  }

  return fallbackStatus;
}

export function buildCashPaymentPatch(nextOrderPaymentStatus: string): CashPaymentPatch | null {
  const status = asOrderPaymentStatus(nextOrderPaymentStatus);
  if (!status) {
    return null;
  }
  if (status === "paid") {
    return { status: "paid", completedAt: new Date(), failedAt: null };
  }
  if (status === "failed") {
    return { status: "failed", completedAt: null, failedAt: new Date() };
  }
  if (status === "pending") {
    return { status: "pending", completedAt: null, failedAt: null };
  }
  return { status: "refunded" };
}

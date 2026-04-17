import { describe, expect, it } from "vitest";
import {
  buildCashPaymentPatch,
  isCashPaymentMethod,
  resolveCashOrderPaymentStatus,
} from "./cash-payment-flow";

describe("cash-payment-flow", () => {
  it("detects canonical and legacy cash method names", () => {
    expect(isCashPaymentMethod("cash")).toBe(true);
    expect(isCashPaymentMethod("cash_on_delivery")).toBe(true);
    expect(isCashPaymentMethod("cod")).toBe(true);
    expect(isCashPaymentMethod("card")).toBe(false);
  });

  it("auto-marks cash order payment as paid when order completes", () => {
    const next = resolveCashOrderPaymentStatus({
      paymentMethod: "cash",
      existingPaymentStatus: "pending",
      requestedStatus: "completed",
      requestedPaymentStatus: undefined,
    });

    expect(next).toBe("paid");
  });

  it("keeps explicit payment status passed by admin", () => {
    const next = resolveCashOrderPaymentStatus({
      paymentMethod: "cash",
      existingPaymentStatus: "pending",
      requestedStatus: "completed",
      requestedPaymentStatus: "refunded",
    });

    expect(next).toBe("refunded");
  });

  it("does not auto-change card order payment status", () => {
    const next = resolveCashOrderPaymentStatus({
      paymentMethod: "card",
      existingPaymentStatus: "pending",
      requestedStatus: "completed",
      requestedPaymentStatus: undefined,
    });

    expect(next).toBeUndefined();
  });

  it("builds paid patch with completedAt timestamp", () => {
    const patch = buildCashPaymentPatch("paid");
    expect(patch?.status).toBe("paid");
    expect(patch?.completedAt).toBeInstanceOf(Date);
    expect(patch?.failedAt).toBeNull();
  });
});

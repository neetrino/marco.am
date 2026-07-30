import { describe, expect, it } from "vitest";
import { classifyArcaReconcileOutcome } from "../arca/classify-status";

describe("classifyArcaReconcileOutcome", () => {
  it("returns paid when bank marks deposited", () => {
    expect(
      classifyArcaReconcileOutcome({
        orderStatus: 2,
        paymentState: "DEPOSITED",
        isPaid: true,
      }),
    ).toBe("paid");
  });

  it("returns failed for declined orderStatus", () => {
    expect(
      classifyArcaReconcileOutcome({
        orderStatus: 6,
        paymentState: null,
        isPaid: false,
      }),
    ).toBe("failed");
  });

  it("returns failed for declined paymentState", () => {
    expect(
      classifyArcaReconcileOutcome({
        orderStatus: 0,
        paymentState: "DECLINED",
        isPaid: false,
      }),
    ).toBe("failed");
  });

  it("returns pending while payment is still open", () => {
    expect(
      classifyArcaReconcileOutcome({
        orderStatus: 0,
        paymentState: "CREATED",
        isPaid: false,
      }),
    ).toBe("pending");
  });
});

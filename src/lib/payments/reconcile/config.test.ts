import { describe, expect, it } from "vitest";
import { resolvePaymentReconcileConfig } from "./config";

describe("resolvePaymentReconcileConfig", () => {
  it("returns static timeout and batch size", () => {
    expect(resolvePaymentReconcileConfig()).toEqual({
      timeoutMinutes: 60,
      batchSize: 25,
    });
  });
});

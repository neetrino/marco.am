import { afterEach, describe, expect, it, vi } from "vitest";
import { resolvePaymentReconcileConfig } from "./config";

describe("resolvePaymentReconcileConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns defaults when env is empty", () => {
    vi.stubEnv("PAYMENT_RECONCILE_INTERVAL_MINUTES", "");
    vi.stubEnv("PAYMENT_PENDING_TIMEOUT_MINUTES", "");
    vi.stubEnv("PAYMENT_RECONCILE_BATCH_SIZE", "");

    expect(resolvePaymentReconcileConfig()).toEqual({
      intervalMinutes: 15,
      timeoutMinutes: 60,
      batchSize: 25,
    });
  });

  it("parses valid env overrides", () => {
    vi.stubEnv("PAYMENT_RECONCILE_INTERVAL_MINUTES", "10");
    vi.stubEnv("PAYMENT_PENDING_TIMEOUT_MINUTES", "90");
    vi.stubEnv("PAYMENT_RECONCILE_BATCH_SIZE", "40");

    expect(resolvePaymentReconcileConfig()).toEqual({
      intervalMinutes: 10,
      timeoutMinutes: 90,
      batchSize: 40,
    });
  });

  it("falls back when values are out of bounds", () => {
    vi.stubEnv("PAYMENT_RECONCILE_INTERVAL_MINUTES", "0");
    vi.stubEnv("PAYMENT_PENDING_TIMEOUT_MINUTES", "0");
    vi.stubEnv("PAYMENT_RECONCILE_BATCH_SIZE", "999");

    expect(resolvePaymentReconcileConfig()).toEqual({
      intervalMinutes: 15,
      timeoutMinutes: 60,
      batchSize: 25,
    });
  });
});

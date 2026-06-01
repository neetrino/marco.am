import { afterEach, describe, expect, it, vi } from "vitest";
import { isMockPaymentFlowAllowed, resolvePaymentCheckoutBaseUrl } from "./payment-env";

describe("payment-env", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("disallows mock payment flow in production tier", () => {
    vi.stubEnv("APP_ENV", "production");
    expect(isMockPaymentFlowAllowed()).toBe(false);
  });

  it("allows mock payment flow in development tier", () => {
    vi.stubEnv("APP_ENV", "development");
    expect(isMockPaymentFlowAllowed()).toBe(true);
  });

  it("throws in production when checkout base URL is missing", () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("PAYMENT_PSP_CHECKOUT_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://shop.example");

    expect(() => resolvePaymentCheckoutBaseUrl()).toThrow();
  });

  it("uses configured checkout base URL", () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("PAYMENT_PSP_CHECKOUT_BASE_URL", "https://psp.example/checkout");

    expect(resolvePaymentCheckoutBaseUrl()).toBe("https://psp.example/checkout");
  });
});

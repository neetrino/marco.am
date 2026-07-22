import { afterEach, describe, expect, it, vi } from "vitest";
import { isCronRequestAuthorized } from "./authorize-cron";

describe("isCronRequestAuthorized", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows missing secret outside production", () => {
    vi.stubEnv("APP_ENV", "development");
    vi.stubEnv("CRON_SECRET", "");

    const request = new Request("http://localhost/api/v1/cron/reconcile-payments");
    expect(isCronRequestAuthorized(request)).toBe(true);
  });

  it("rejects missing secret in production", () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("CRON_SECRET", "");

    const request = new Request("http://localhost/api/v1/cron/reconcile-payments");
    expect(isCronRequestAuthorized(request)).toBe(false);
  });

  it("accepts matching bearer token", () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("CRON_SECRET", "test-cron-secret");

    const request = new Request("http://localhost/api/v1/cron/reconcile-payments", {
      headers: { Authorization: "Bearer test-cron-secret" },
    });
    expect(isCronRequestAuthorized(request)).toBe(true);
  });

  it("rejects wrong bearer token", () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("CRON_SECRET", "test-cron-secret");

    const request = new Request("http://localhost/api/v1/cron/reconcile-payments", {
      headers: { Authorization: "Bearer wrong" },
    });
    expect(isCronRequestAuthorized(request)).toBe(false);
  });
});

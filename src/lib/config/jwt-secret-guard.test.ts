import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertJwtSecretConfigured,
  collectJwtSecretIssues,
} from "@/lib/config/jwt-secret-guard";
import { logger } from "@/lib/utils/logger";

describe("collectJwtSecretIssues", () => {
  it("flags missing secret", () => {
    expect(collectJwtSecretIssues("")).toContain("JWT_SECRET is missing");
  });

  it("flags short secret", () => {
    const issues = collectJwtSecretIssues("short");
    expect(issues.some((issue) => issue.includes("at least 32"))).toBe(true);
  });

  it("flags known placeholder", () => {
    expect(
      collectJwtSecretIssues("your-super-secret-jwt-key-change-this-in-production"),
    ).toContain("JWT_SECRET uses a known weak placeholder value");
  });

  it("accepts strong secret", () => {
    expect(
      collectJwtSecretIssues("a-very-long-random-production-secret-value-32chars"),
    ).toEqual([]);
  });
});

describe("assertJwtSecretConfigured", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("throws on production when JWT_SECRET is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("JWT_SECRET", "");

    expect(() => assertJwtSecretConfigured()).toThrow(
      "JWT_SECRET is not production-safe",
    );
  });

  it("logs on staging preview without crashing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("JWT_SECRET", "");
    const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

    expect(() => assertJwtSecretConfigured()).not.toThrow();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("JWT_SECRET is not production-safe"),
      { tier: "staging" },
    );
  });
});

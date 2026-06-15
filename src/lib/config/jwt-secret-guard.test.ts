import { describe, expect, it } from "vitest";
import { collectJwtSecretIssues } from "@/lib/config/jwt-secret-guard";

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

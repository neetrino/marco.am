import { describe, expect, it } from "vitest";
import { isAuthEpochValid, readTokenAuthEpoch } from "@/lib/auth/auth-epoch";
import { normalizeUserRoles, sanitizeUserRoles } from "@/lib/constants/user-roles";

describe("readTokenAuthEpoch", () => {
  it("defaults missing values to 0", () => {
    expect(readTokenAuthEpoch({})).toBe(0);
    expect(readTokenAuthEpoch({ authEpoch: undefined })).toBe(0);
  });

  it("reads valid integer epochs", () => {
    expect(readTokenAuthEpoch({ authEpoch: 2 })).toBe(2);
  });

  it("rejects invalid epochs", () => {
    expect(readTokenAuthEpoch({ authEpoch: -1 })).toBe(0);
    expect(readTokenAuthEpoch({ authEpoch: 1.5 })).toBe(0);
    expect(readTokenAuthEpoch({ authEpoch: "1" })).toBe(0);
  });
});

describe("isAuthEpochValid", () => {
  it("matches equal epochs", () => {
    expect(isAuthEpochValid(0, 0)).toBe(true);
    expect(isAuthEpochValid(3, 3)).toBe(true);
  });

  it("rejects mismatched epochs", () => {
    expect(isAuthEpochValid(0, 1)).toBe(false);
  });
});

describe("user roles", () => {
  it("normalizes empty roles to customer", () => {
    expect(normalizeUserRoles([])).toEqual(["customer"]);
  });

  it("keeps known roles", () => {
    expect(normalizeUserRoles(["admin", "customer"])).toEqual(["admin", "customer"]);
  });

  it("drops unknown roles and dedupes", () => {
    expect(sanitizeUserRoles(["admin", "superuser", "admin"])).toEqual(["admin"]);
  });
});

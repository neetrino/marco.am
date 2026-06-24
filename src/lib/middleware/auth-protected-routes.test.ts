import { describe, expect, it } from "vitest";
import {
  isAuthRequiredOrdersApi,
  isAuthRequiredPage,
  isAuthRequiredUsersApi,
} from "./auth-protected-routes";

describe("isAuthRequiredPage", () => {
  it("requires auth for account and admin pages", () => {
    expect(isAuthRequiredPage("/profile")).toBe(true);
    expect(isAuthRequiredPage("/wishlist")).toBe(true);
    expect(isAuthRequiredPage("/supersudo")).toBe(true);
    expect(isAuthRequiredPage("/supersudo/products")).toBe(true);
    expect(isAuthRequiredPage("/orders/ORD-123")).toBe(true);
  });

  it("allows public storefront pages", () => {
    expect(isAuthRequiredPage("/")).toBe(false);
    expect(isAuthRequiredPage("/cart")).toBe(false);
    expect(isAuthRequiredPage("/checkout")).toBe(false);
    expect(isAuthRequiredPage("/compare")).toBe(false);
    expect(isAuthRequiredPage("/products")).toBe(false);
    expect(isAuthRequiredPage("/login")).toBe(false);
  });
});

describe("isAuthRequiredUsersApi", () => {
  it("matches all user account endpoints", () => {
    expect(isAuthRequiredUsersApi("/api/v1/users/profile")).toBe(true);
    expect(isAuthRequiredUsersApi("/api/v1/users/addresses")).toBe(true);
    expect(isAuthRequiredUsersApi("/api/v1/users/password")).toBe(true);
  });

  it("does not match unrelated APIs", () => {
    expect(isAuthRequiredUsersApi("/api/v1/cart")).toBe(false);
    expect(isAuthRequiredUsersApi("/api/v1/wishlist")).toBe(false);
  });
});

describe("isAuthRequiredOrdersApi", () => {
  it("requires auth for list, detail, and reorder", () => {
    expect(isAuthRequiredOrdersApi("/api/v1/orders")).toBe(true);
    expect(isAuthRequiredOrdersApi("/api/v1/orders/ORD-1")).toBe(true);
    expect(isAuthRequiredOrdersApi("/api/v1/orders/ORD-1/reorder")).toBe(true);
  });

  it("allows guest checkout", () => {
    expect(isAuthRequiredOrdersApi("/api/v1/orders/checkout")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { checkSameOriginRequest } from "@/lib/middleware/same-origin-csrf";

function buildRequest(
  path: string,
  init: { method?: string; headers?: Record<string, string> } = {},
): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: init.method ?? "POST",
    headers: init.headers,
  });
}

describe("checkSameOriginRequest", () => {
  it("allows same-origin POST with Origin header", () => {
    const response = checkSameOriginRequest(
      buildRequest("/api/v1/auth/login", {
        headers: { Origin: "http://localhost:3000" },
      }),
    );
    expect(response).toBeNull();
  });

  it("blocks cross-origin POST with Origin header", () => {
    const response = checkSameOriginRequest(
      buildRequest("/api/v1/auth/login", {
        headers: { Origin: "https://evil.com" },
      }),
    );
    expect(response?.status).toBe(403);
  });

  it("blocks POST without Origin or Referer", () => {
    const response = checkSameOriginRequest(buildRequest("/api/v1/auth/login"));
    expect(response?.status).toBe(403);
  });

  it("allows POST with same-origin Referer when Origin is missing", () => {
    const response = checkSameOriginRequest(
      buildRequest("/api/v1/orders/checkout", {
        headers: { Referer: "http://localhost:3000/products" },
      }),
    );
    expect(response).toBeNull();
  });

  it("allows Bearer-authenticated POST without Origin", () => {
    const response = checkSameOriginRequest(
      buildRequest("/api/v1/supersudo/users", {
        headers: { Authorization: "Bearer test-token" },
      }),
    );
    expect(response).toBeNull();
  });

  it("exempts payment webhook POST without Origin", () => {
    const response = checkSameOriginRequest(
      buildRequest("/api/v1/payments/webhook", {
        headers: { "x-psp-signature": "sig" },
      }),
    );
    expect(response).toBeNull();
  });

  it("skips GET requests", () => {
    const response = checkSameOriginRequest(
      buildRequest("/api/v1/products", {
        method: "GET",
        headers: { Origin: "https://evil.com" },
      }),
    );
    expect(response).toBeNull();
  });
});

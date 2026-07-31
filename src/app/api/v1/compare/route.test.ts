import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  COMPARE_MAX_LIST_ITEMS,
  COMPARE_MAX_PER_CATEGORY,
  COMPARE_SESSION_COOKIE_NAME,
} from "@/lib/constants/compare-session";

const mocks = vi.hoisted(() => ({
  addCompareItemForGuest: vi.fn(),
  authenticateToken: vi.fn(),
  getCompareForGuest: vi.fn(),
}));

vi.mock("@/lib/middleware/auth", () => ({
  authenticateToken: mocks.authenticateToken,
}));

vi.mock("@/lib/services/compare.service", () => ({
  addCompareItemForGuest: mocks.addCompareItemForGuest,
  addCompareItemForUser: vi.fn(),
  getCompareForGuest: mocks.getCompareForGuest,
  getCompareForUser: vi.fn(),
}));

import { GET, POST } from "./route";

const EMPTY_COMPARE_PAYLOAD = {
  compare: {
    id: "",
    maxItems: COMPARE_MAX_PER_CATEGORY,
    maxItemsPerCategory: COMPARE_MAX_PER_CATEGORY,
    maxListItems: COMPARE_MAX_LIST_ITEMS,
    items: [],
    sections: [],
  },
  specRows: [],
};

describe("compare guest routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateToken.mockResolvedValue(null);
  });

  it("returns an empty GET payload without setting a session cookie", async () => {
    mocks.getCompareForGuest.mockResolvedValue({
      payload: EMPTY_COMPARE_PAYLOAD,
      sessionExists: false,
    });
    const request = new NextRequest("http://localhost/api/v1/compare");

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(EMPTY_COMPARE_PAYLOAD);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("sets the session cookie after the first successful guest add", async () => {
    mocks.addCompareItemForGuest.mockResolvedValue({
      payload: EMPTY_COMPARE_PAYLOAD,
      sessionToken: "new-session-token",
      sessionCreated: true,
    });
    const request = new NextRequest("http://localhost/api/v1/compare", {
      method: "POST",
      body: JSON.stringify({ productId: "product-1" }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(response.cookies.get(COMPARE_SESSION_COOKIE_NAME)?.value).toBe(
      "new-session-token"
    );
  });
});

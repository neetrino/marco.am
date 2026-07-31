import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { WISHLIST_SESSION_COOKIE_NAME } from "@/lib/constants/wishlist-session";

const mocks = vi.hoisted(() => ({
  authenticateToken: vi.fn(),
  getWishlistForGuest: vi.fn(),
}));

vi.mock("@/lib/middleware/auth", () => ({
  authenticateToken: mocks.authenticateToken,
}));

vi.mock("@/lib/services/wishlist.service", () => ({
  addWishlistItemForUser: vi.fn(),
  getWishlistForGuest: mocks.getWishlistForGuest,
  getWishlistForUser: vi.fn(),
}));

import { GET } from "./route";

describe("wishlist GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateToken.mockResolvedValue(null);
  });

  it("returns an empty guest payload without setting a session cookie", async () => {
    mocks.getWishlistForGuest.mockResolvedValue({
      payload: { wishlist: { id: "", items: [] } },
      sessionExists: false,
    });
    const request = new NextRequest("http://localhost/api/v1/wishlist");

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      wishlist: { id: "", items: [] },
    });
    expect(response.cookies.get(WISHLIST_SESSION_COOKIE_NAME)).toBeUndefined();
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});

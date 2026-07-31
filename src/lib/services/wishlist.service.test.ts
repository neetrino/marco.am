import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WISHLIST_SESSION_MAX_AGE_SECONDS } from "@/lib/constants/wishlist-session";

const mocks = vi.hoisted(() => ({
  wishlistCreate: vi.fn(),
  wishlistFindUnique: vi.fn(),
  wishlistUpdate: vi.fn(),
  wishlistItemDeleteMany: vi.fn(),
  wishlistItemFindMany: vi.fn(),
}));

vi.mock("@white-shop/db", () => ({
  db: {
    product: { findFirst: vi.fn() },
    wishlist: {
      create: mocks.wishlistCreate,
      findUnique: mocks.wishlistFindUnique,
      update: mocks.wishlistUpdate,
    },
    wishlistItem: {
      aggregate: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      deleteMany: mocks.wishlistItemDeleteMany,
      findMany: mocks.wishlistItemFindMany,
      findUnique: vi.fn(),
    },
  },
}));

import { getWishlistForGuest } from "./wishlist.service";

const NOW = new Date("2026-07-31T00:00:00.000Z");
const MILLISECONDS_PER_SECOND = 1000;

function expiresIn(seconds: number): Date {
  return new Date(NOW.getTime() + seconds * MILLISECONDS_PER_SECOND);
}

describe("getWishlistForGuest", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.clearAllMocks();
    mocks.wishlistItemFindMany.mockResolvedValue([]);
    mocks.wishlistUpdate.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns an empty payload without creating a session when no token exists", async () => {
    const result = await getWishlistForGuest(undefined, "en");

    expect(result).toEqual({
      payload: { wishlist: { id: "", items: [] } },
      sessionExists: false,
    });
    expect(mocks.wishlistFindUnique).not.toHaveBeenCalled();
    expect(mocks.wishlistCreate).not.toHaveBeenCalled();
    expect(mocks.wishlistUpdate).not.toHaveBeenCalled();
  });

  it("returns an empty payload without creating a session for an unknown token", async () => {
    mocks.wishlistFindUnique.mockResolvedValue(null);

    const result = await getWishlistForGuest("unknown-session", "en");

    expect(result.payload).toEqual({ wishlist: { id: "", items: [] } });
    expect(result.sessionExists).toBe(false);
    expect(mocks.wishlistCreate).not.toHaveBeenCalled();
    expect(mocks.wishlistUpdate).not.toHaveBeenCalled();
  });

  it("loads a valid session without touching an expiry above half-life", async () => {
    mocks.wishlistFindUnique.mockResolvedValue({
      id: "wishlist-1",
      expiresAt: expiresIn(WISHLIST_SESSION_MAX_AGE_SECONDS),
    });

    const result = await getWishlistForGuest("session-1", "en");

    expect(result.sessionExists).toBe(true);
    expect(result.payload.wishlist.id).toBe("wishlist-1");
    expect(mocks.wishlistUpdate).not.toHaveBeenCalled();
  });

  it("touches a valid session expiry below half-life", async () => {
    const belowHalfLife = WISHLIST_SESSION_MAX_AGE_SECONDS / 2 - 1;
    mocks.wishlistFindUnique.mockResolvedValue({
      id: "wishlist-1",
      expiresAt: expiresIn(belowHalfLife),
    });

    await getWishlistForGuest("session-1", "en");

    expect(mocks.wishlistUpdate).toHaveBeenCalledOnce();
    expect(mocks.wishlistUpdate).toHaveBeenCalledWith({
      where: { id: "wishlist-1" },
      data: { expiresAt: expiresIn(WISHLIST_SESSION_MAX_AGE_SECONDS) },
    });
  });
});

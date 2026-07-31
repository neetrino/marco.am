import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@white-shop/db", () => ({
  db: {
    wishlist: {
      count: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    compareList: {
      count: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { db } from "@white-shop/db";
import {
  buildDeletableGuestListWhere,
  buildEmptyGuestListWhere,
  buildExpiredGuestListWhere,
  EMPTY_GUEST_LIST_MIN_AGE_MS,
  GUEST_LIST_CLEANUP_BATCH_SIZE,
  previewGuestListCleanup,
  runGuestListCleanup,
} from "./guest-list-cleanup.service";

const wishlistCount = db.wishlist.count as unknown as ReturnType<typeof vi.fn>;
const wishlistFindMany = db.wishlist.findMany as unknown as ReturnType<typeof vi.fn>;
const wishlistDeleteMany = db.wishlist.deleteMany as unknown as ReturnType<typeof vi.fn>;
const compareCount = db.compareList.count as unknown as ReturnType<typeof vi.fn>;
const compareFindMany = db.compareList.findMany as unknown as ReturnType<typeof vi.fn>;
const compareDeleteMany = db.compareList.deleteMany as unknown as ReturnType<typeof vi.fn>;

const NOW = new Date("2026-07-31T12:00:00.000Z");

describe("guest list where builders", () => {
  it("selects empty guest lists (userId null, zero items)", () => {
    expect(buildEmptyGuestListWhere(NOW, 0)).toEqual({
      userId: null,
      items: { none: {} },
    });
  });

  it("does not select non-empty lists (requires items.none)", () => {
    const where = buildEmptyGuestListWhere(NOW, 0);
    expect(where.items).toEqual({ none: {} });
    expect(where).not.toHaveProperty("items.some");
  });

  it("never selects user-owned lists (userId always null)", () => {
    expect(buildEmptyGuestListWhere(NOW, 0).userId).toBeNull();
    expect(buildExpiredGuestListWhere(NOW).userId).toBeNull();
    expect(buildDeletableGuestListWhere(NOW, 0).userId).toBeNull();
    expect(buildDeletableGuestListWhere(NOW, EMPTY_GUEST_LIST_MIN_AGE_MS).userId).toBeNull();
  });

  it("selects expired guest lists", () => {
    expect(buildExpiredGuestListWhere(NOW)).toEqual({
      userId: null,
      expiresAt: { lt: NOW },
    });
  });

  it("applies 24h age filter for empty lists in cron mode", () => {
    const where = buildEmptyGuestListWhere(NOW, EMPTY_GUEST_LIST_MIN_AGE_MS);
    expect(where).toEqual({
      userId: null,
      items: { none: {} },
      createdAt: { lt: new Date(NOW.getTime() - EMPTY_GUEST_LIST_MIN_AGE_MS) },
    });
  });

  it("unions empty and expired conditions for deletion", () => {
    const where = buildDeletableGuestListWhere(NOW, 0);
    expect(where.OR).toEqual([
      { items: { none: {} } },
      { expiresAt: { lt: NOW } },
    ]);
  });
});

describe("previewGuestListCleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    wishlistCount.mockResolvedValue(0);
    compareCount.mockResolvedValue(0);
  });

  it("queries empty and expired guest lists with userId null", async () => {
    wishlistCount
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(11);
    compareCount
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(9);

    const preview = await previewGuestListCleanup({ emptyMinAgeMs: 0, now: NOW });

    expect(preview).toEqual({
      emptyWishlists: 10,
      expiredWishlists: 3,
      emptyCompareLists: 8,
      expiredCompareLists: 2,
      wishlistsToDelete: 11,
      compareListsToDelete: 9,
    });

    const wishlistWheres = wishlistCount.mock.calls.map((call) => call[0]?.where);
    expect(wishlistWheres.every((where) => where?.userId === null)).toBe(true);
    expect(wishlistWheres[0]).toMatchObject({ items: { none: {} } });
    expect(wishlistWheres[1]).toMatchObject({ expiresAt: { lt: NOW } });
  });
});

describe("runGuestListCleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    wishlistFindMany.mockResolvedValue([]);
    compareFindMany.mockResolvedValue([]);
    wishlistDeleteMany.mockResolvedValue({ count: 0 });
    compareDeleteMany.mockResolvedValue({ count: 0 });
  });

  it("deletes selected guest lists in batches with userId null guard", async () => {
    const wishlistIds = Array.from({ length: GUEST_LIST_CLEANUP_BATCH_SIZE + 2 }, (_, i) => `w-${i}`);
    wishlistFindMany.mockResolvedValue(wishlistIds.map((id) => ({ id })));
    compareFindMany.mockResolvedValue([{ id: "c-1" }]);
    wishlistDeleteMany
      .mockResolvedValueOnce({ count: GUEST_LIST_CLEANUP_BATCH_SIZE })
      .mockResolvedValueOnce({ count: 2 });
    compareDeleteMany.mockResolvedValue({ count: 1 });

    const result = await runGuestListCleanup({ emptyMinAgeMs: 0, now: NOW });

    expect(result).toEqual({ wishlistsDeleted: GUEST_LIST_CLEANUP_BATCH_SIZE + 2, compareListsDeleted: 1 });
    expect(wishlistDeleteMany).toHaveBeenCalledTimes(2);
    expect(wishlistDeleteMany.mock.calls[0]?.[0]).toEqual({
      where: {
        id: { in: wishlistIds.slice(0, GUEST_LIST_CLEANUP_BATCH_SIZE) },
        userId: null,
      },
    });
    expect(compareDeleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["c-1"] }, userId: null },
    });
  });
});

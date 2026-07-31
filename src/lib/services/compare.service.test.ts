import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  COMPARE_MAX_LIST_ITEMS,
  COMPARE_MAX_PER_CATEGORY,
  COMPARE_SESSION_MAX_AGE_SECONDS,
} from "@/lib/constants/compare-session";

const mocks = vi.hoisted(() => ({
  buildComparePayload: vi.fn(),
  compareItemCreate: vi.fn(),
  compareListCreate: vi.fn(),
  compareListFindUnique: vi.fn(),
  compareListUpdate: vi.fn(),
  productFindFirst: vi.fn(),
}));

vi.mock("nanoid", () => ({
  nanoid: () => "new-session-token",
}));

vi.mock("@white-shop/db", () => ({
  db: {
    compareList: {
      create: mocks.compareListCreate,
      findUnique: mocks.compareListFindUnique,
      update: mocks.compareListUpdate,
    },
    compareItem: {
      aggregate: vi.fn().mockResolvedValue({ _max: { position: null } }),
      count: vi.fn().mockResolvedValue(0),
      create: mocks.compareItemCreate,
      deleteMany: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    product: {
      findFirst: mocks.productFindFirst,
    },
  },
}));

vi.mock("@/lib/services/compare-payload.service", () => ({
  buildComparePayload: mocks.buildComparePayload,
}));

import {
  addCompareItemForGuest,
  getCompareForGuest,
} from "./compare.service";

const NOW = new Date("2026-07-31T00:00:00.000Z");
const MILLISECONDS_PER_SECOND = 1000;
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

function expiresIn(seconds: number): Date {
  return new Date(NOW.getTime() + seconds * MILLISECONDS_PER_SECOND);
}

describe("guest compare sessions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.clearAllMocks();
    mocks.buildComparePayload.mockResolvedValue(EMPTY_COMPARE_PAYLOAD);
    mocks.compareListUpdate.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns an empty payload without creating a session when no token exists", async () => {
    const result = await getCompareForGuest(undefined, "en");

    expect(result).toEqual({
      payload: EMPTY_COMPARE_PAYLOAD,
      sessionExists: false,
    });
    expect(mocks.compareListFindUnique).not.toHaveBeenCalled();
    expect(mocks.compareListCreate).not.toHaveBeenCalled();
    expect(mocks.compareListUpdate).not.toHaveBeenCalled();
  });

  it("returns an empty payload without creating a session for an unknown token", async () => {
    mocks.compareListFindUnique.mockResolvedValue(null);

    const result = await getCompareForGuest("unknown-session", "en");

    expect(result.payload).toEqual(EMPTY_COMPARE_PAYLOAD);
    expect(result.sessionExists).toBe(false);
    expect(mocks.compareListCreate).not.toHaveBeenCalled();
    expect(mocks.compareListUpdate).not.toHaveBeenCalled();
  });

  it("loads a valid session without touching an expiry above half-life", async () => {
    mocks.compareListFindUnique.mockResolvedValue({
      id: "compare-1",
      expiresAt: expiresIn(COMPARE_SESSION_MAX_AGE_SECONDS),
    });

    const result = await getCompareForGuest("session-1", "en");

    expect(result.sessionExists).toBe(true);
    expect(mocks.buildComparePayload).toHaveBeenCalledWith("compare-1", "en", "full");
    expect(mocks.compareListUpdate).not.toHaveBeenCalled();
  });

  it("touches a valid session expiry below half-life", async () => {
    const belowHalfLife = COMPARE_SESSION_MAX_AGE_SECONDS / 2 - 1;
    mocks.compareListFindUnique.mockResolvedValue({
      id: "compare-1",
      expiresAt: expiresIn(belowHalfLife),
    });

    await getCompareForGuest("session-1", "en");

    expect(mocks.compareListUpdate).toHaveBeenCalledWith({
      where: { id: "compare-1" },
      data: { expiresAt: expiresIn(COMPARE_SESSION_MAX_AGE_SECONDS) },
    });
  });

  it("creates the guest session lazily on the first compare add", async () => {
    mocks.compareListFindUnique.mockResolvedValue(null);
    mocks.compareListCreate.mockResolvedValue({ id: "compare-new" });
    mocks.productFindFirst.mockResolvedValue({
      id: "product-1",
      primaryCategoryId: "category-1",
      categoryIds: ["category-1"],
    });

    const result = await addCompareItemForGuest(undefined, "product-1", "en");

    expect(mocks.compareListCreate).toHaveBeenCalledOnce();
    expect(mocks.compareItemCreate).toHaveBeenCalledWith({
      data: {
        compareListId: "compare-new",
        productId: "product-1",
        position: 0,
      },
    });
    expect(result.sessionToken).toBe("new-session-token");
    expect(result.sessionCreated).toBe(true);
  });
});

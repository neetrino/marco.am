import { db } from "@white-shop/db";

/** Neon-friendly deleteMany batch size (ids per call). */
export const GUEST_LIST_CLEANUP_BATCH_SIZE = 1000;

/** Cron only: empty guest lists must be older than this before deletion. */
export const EMPTY_GUEST_LIST_MIN_AGE_MS = 24 * 60 * 60 * 1000;

export type GuestListCleanupOptions = {
  /**
   * Minimum age for empty guest lists (userId null, zero items).
   * Use `0` for one-off cleanup; use {@link EMPTY_GUEST_LIST_MIN_AGE_MS} for cron.
   */
  emptyMinAgeMs: number;
  now?: Date;
};

export type GuestListCleanupPreview = {
  emptyWishlists: number;
  expiredWishlists: number;
  emptyCompareLists: number;
  expiredCompareLists: number;
  wishlistsToDelete: number;
  compareListsToDelete: number;
};

export type GuestListCleanupResult = {
  wishlistsDeleted: number;
  compareListsDeleted: number;
};

type GuestListWhere = {
  userId: null;
  items?: { none: Record<string, never> };
  expiresAt?: { lt: Date };
  createdAt?: { lt: Date };
  OR?: Array<{
    items?: { none: Record<string, never> };
    expiresAt?: { lt: Date };
    createdAt?: { lt: Date };
  }>;
};

function resolveNow(now: Date | undefined): Date {
  return now ?? new Date();
}

/** Guest lists with zero items (optionally older than `emptyMinAgeMs`). */
export function buildEmptyGuestListWhere(
  now: Date,
  emptyMinAgeMs: number,
): GuestListWhere {
  if (emptyMinAgeMs <= 0) {
    return { userId: null, items: { none: {} } };
  }
  return {
    userId: null,
    items: { none: {} },
    createdAt: { lt: new Date(now.getTime() - emptyMinAgeMs) },
  };
}

/** Guest lists past their expiry. */
export function buildExpiredGuestListWhere(now: Date): GuestListWhere {
  return { userId: null, expiresAt: { lt: now } };
}

/** Union of empty (age-filtered) and expired guest lists. */
export function buildDeletableGuestListWhere(
  now: Date,
  emptyMinAgeMs: number,
): GuestListWhere {
  const empty = buildEmptyGuestListWhere(now, emptyMinAgeMs);
  const { userId: _userId, ...emptyClause } = empty;
  return {
    userId: null,
    OR: [emptyClause, { expiresAt: { lt: now } }],
  };
}

async function deleteIdsInBatches(
  ids: readonly string[],
  deleteBatch: (batch: string[]) => Promise<{ count: number }>,
): Promise<number> {
  let deleted = 0;
  for (let offset = 0; offset < ids.length; offset += GUEST_LIST_CLEANUP_BATCH_SIZE) {
    const batch = ids.slice(offset, offset + GUEST_LIST_CLEANUP_BATCH_SIZE);
    const result = await deleteBatch(batch);
    deleted += result.count;
  }
  return deleted;
}

/**
 * Counts guest wishlists/compare lists that would be deleted (empty and/or expired).
 * Category counts may overlap; `*ToDelete` is the unique union.
 */
export async function previewGuestListCleanup(
  options: GuestListCleanupOptions,
): Promise<GuestListCleanupPreview> {
  const now = resolveNow(options.now);
  const emptyWhere = buildEmptyGuestListWhere(now, options.emptyMinAgeMs);
  const expiredWhere = buildExpiredGuestListWhere(now);
  const deletableWhere = buildDeletableGuestListWhere(now, options.emptyMinAgeMs);

  const [
    emptyWishlists,
    expiredWishlists,
    emptyCompareLists,
    expiredCompareLists,
    wishlistsToDelete,
    compareListsToDelete,
  ] = await Promise.all([
    db.wishlist.count({ where: emptyWhere }),
    db.wishlist.count({ where: expiredWhere }),
    db.compareList.count({ where: emptyWhere }),
    db.compareList.count({ where: expiredWhere }),
    db.wishlist.count({ where: deletableWhere }),
    db.compareList.count({ where: deletableWhere }),
  ]);

  return {
    emptyWishlists,
    expiredWishlists,
    emptyCompareLists,
    expiredCompareLists,
    wishlistsToDelete,
    compareListsToDelete,
  };
}

/**
 * Deletes empty and/or expired guest lists in batches.
 * Child items cascade via Prisma `onDelete: Cascade` on WishlistItem/CompareItem.
 */
export async function runGuestListCleanup(
  options: GuestListCleanupOptions,
): Promise<GuestListCleanupResult> {
  const now = resolveNow(options.now);
  const deletableWhere = buildDeletableGuestListWhere(now, options.emptyMinAgeMs);

  const [wishlistRows, compareRows] = await Promise.all([
    db.wishlist.findMany({ where: deletableWhere, select: { id: true } }),
    db.compareList.findMany({ where: deletableWhere, select: { id: true } }),
  ]);

  const wishlistIds = wishlistRows.map((row) => row.id);
  const compareListIds = compareRows.map((row) => row.id);

  const [wishlistsDeleted, compareListsDeleted] = await Promise.all([
    deleteIdsInBatches(wishlistIds, (batch) =>
      db.wishlist.deleteMany({ where: { id: { in: batch }, userId: null } }),
    ),
    deleteIdsInBatches(compareListIds, (batch) =>
      db.compareList.deleteMany({ where: { id: { in: batch }, userId: null } }),
    ),
  ]);

  return { wishlistsDeleted, compareListsDeleted };
}

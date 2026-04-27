import { db } from "@white-shop/db";
import {
  COMPARE_MAX_LIST_ITEMS,
  COMPARE_MAX_PER_CATEGORY,
  COMPARE_SESSION_MAX_AGE_SECONDS,
} from "@/lib/constants/compare-session";
import {
  filterCompareLinesByCategoryLimits,
  resolveCompareCategoryId,
} from "@/lib/compare/compare-category";

function compareExpiresAt(): Date {
  return new Date(Date.now() + COMPARE_SESSION_MAX_AGE_SECONDS * 1000);
}

/**
 * Moves guest compare list into the authenticated user (union by product).
 * Deletes the guest list after merge.
 */
export async function mergeGuestCompareIntoUser(
  sessionToken: string | undefined,
  userId: string
): Promise<{ mergedItems: number; guestCompareFound: boolean }> {
  if (!sessionToken) {
    return { mergedItems: 0, guestCompareFound: false };
  }

  return db.$transaction(async (tx) => {
    const guest = await tx.compareList.findUnique({
      where: { sessionToken },
      include: { items: true },
    });

    if (!guest) {
      return { mergedItems: 0, guestCompareFound: false };
    }

    if (guest.items.length === 0) {
      await tx.compareList.delete({ where: { id: guest.id } });
      return { mergedItems: 0, guestCompareFound: true };
    }

    const userCompare = await tx.compareList.findUnique({
      where: { userId },
    });

    const sortedGuest = [...guest.items].sort((a, b) => a.position - b.position);
    const guestProductIds = sortedGuest.map((i) => i.productId);
    const guestProducts = await tx.product.findMany({
      where: { id: { in: guestProductIds } },
      select: { id: true, primaryCategoryId: true, categoryIds: true },
    });
    const guestProductById = new Map(guestProducts.map((p) => [p.id, p]));

    if (!userCompare) {
      const keepItems = filterCompareLinesByCategoryLimits(
        sortedGuest,
        guestProductById,
        COMPARE_MAX_PER_CATEGORY,
        COMPARE_MAX_LIST_ITEMS
      );

      await tx.compareList.update({
        where: { id: guest.id },
        data: {
          userId,
          sessionToken: null,
          expiresAt: compareExpiresAt(),
        },
      });

      const keepIds = new Set(keepItems.map((i) => i.id));
      const removable = sortedGuest.filter((i) => !keepIds.has(i.id));
      if (removable.length > 0) {
        await tx.compareItem.deleteMany({
          where: { id: { in: removable.map((i) => i.id) } },
        });
      }

      return { mergedItems: keepItems.length, guestCompareFound: true };
    }

    const existingIds = new Set(
      (
        await tx.compareItem.findMany({
          where: { compareListId: userCompare.id },
          select: { productId: true },
        })
      ).map((row) => row.productId)
    );

    const userRows = await tx.compareItem.findMany({
      where: { compareListId: userCompare.id },
      select: {
        product: {
          select: { primaryCategoryId: true, categoryIds: true },
        },
      },
    });
    const countsByKey = new Map<string, number>();
    for (const row of userRows) {
      const k = resolveCompareCategoryId(row.product);
      countsByKey.set(k, (countsByKey.get(k) ?? 0) + 1);
    }
    let listTotal = userRows.length;

    let pos =
      ((
        await tx.compareItem.aggregate({
          where: { compareListId: userCompare.id },
          _max: { position: true },
        })
      )._max.position ?? -1) + 1;

    let merged = 0;
    for (const line of sortedGuest) {
      if (existingIds.has(line.productId)) {
        continue;
      }
      const p = guestProductById.get(line.productId);
      if (!p) {
        continue;
      }

      if (listTotal >= COMPARE_MAX_LIST_ITEMS) {
        break;
      }

      const incomingKey = resolveCompareCategoryId(p);
      const inCat = countsByKey.get(incomingKey) ?? 0;
      if (inCat >= COMPARE_MAX_PER_CATEGORY) {
        continue;
      }

      await tx.compareItem.create({
        data: {
          compareListId: userCompare.id,
          productId: line.productId,
          position: pos,
        },
      });
      pos += 1;
      existingIds.add(line.productId);
      countsByKey.set(incomingKey, inCat + 1);
      listTotal += 1;
      merged += 1;
    }

    await tx.compareList.delete({ where: { id: guest.id } });
    await tx.compareList.update({
      where: { id: userCompare.id },
      data: { expiresAt: compareExpiresAt() },
    });

    return { mergedItems: merged, guestCompareFound: true };
  });
}

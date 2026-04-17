import { db } from "@white-shop/db";
import {
  WISHLIST_MAX_ITEMS,
  WISHLIST_SESSION_MAX_AGE_SECONDS,
} from "@/lib/constants/wishlist-session";

function wishlistExpiresAt(): Date {
  return new Date(Date.now() + WISHLIST_SESSION_MAX_AGE_SECONDS * 1000);
}

/**
 * Moves guest wishlist into the authenticated user (union by product). Deletes the guest row after.
 */
export async function mergeGuestWishlistIntoUser(
  sessionToken: string | undefined,
  userId: string
): Promise<{ mergedItems: number; guestWishlistFound: boolean }> {
  if (!sessionToken) {
    return { mergedItems: 0, guestWishlistFound: false };
  }

  return db.$transaction(async (tx) => {
    const guest = await tx.wishlist.findUnique({
      where: { sessionToken },
      include: { items: true },
    });

    if (!guest) {
      return { mergedItems: 0, guestWishlistFound: false };
    }

    if (guest.items.length === 0) {
      await tx.wishlist.delete({ where: { id: guest.id } });
      return { mergedItems: 0, guestWishlistFound: true };
    }

    const userWishlist = await tx.wishlist.findUnique({
      where: { userId },
    });

    if (!userWishlist) {
      await tx.wishlist.update({
        where: { id: guest.id },
        data: {
          userId,
          sessionToken: null,
          expiresAt: wishlistExpiresAt(),
        },
      });
      return { mergedItems: guest.items.length, guestWishlistFound: true };
    }

    const existingIds = new Set(
      (
        await tx.wishlistItem.findMany({
          where: { wishlistId: userWishlist.id },
          select: { productId: true },
        })
      ).map((r) => r.productId)
    );

    let pos =
      ((
        await tx.wishlistItem.aggregate({
          where: { wishlistId: userWishlist.id },
          _max: { position: true },
        })
      )._max.position ?? -1) + 1;

    let merged = 0;
    const sortedGuest = [...guest.items].sort((a, b) => a.position - b.position);

    for (const line of sortedGuest) {
      if (existingIds.has(line.productId)) {
        continue;
      }
      const size = await tx.wishlistItem.count({
        where: { wishlistId: userWishlist.id },
      });
      if (size >= WISHLIST_MAX_ITEMS) {
        break;
      }
      await tx.wishlistItem.create({
        data: {
          wishlistId: userWishlist.id,
          productId: line.productId,
          position: pos,
        },
      });
      pos += 1;
      existingIds.add(line.productId);
      merged += 1;
    }

    await tx.wishlist.delete({ where: { id: guest.id } });
    await tx.wishlist.update({
      where: { id: userWishlist.id },
      data: { expiresAt: wishlistExpiresAt() },
    });

    return { mergedItems: merged, guestWishlistFound: true };
  });
}

import { db } from "@white-shop/db";
import { nanoid } from "nanoid";
import {
  WISHLIST_MAX_ITEMS,
  WISHLIST_SESSION_MAX_AGE_SECONDS,
} from "@/lib/constants/wishlist-session";
import { extractMediaUrl } from "@/lib/utils/extractMediaUrl";
import { logger } from "@/lib/utils/logger";

function wishlistExpiresAt(): Date {
  return new Date(Date.now() + WISHLIST_SESSION_MAX_AGE_SECONDS * 1000);
}

export type WishlistApiItem = {
  productId: string;
  title: string;
  slug: string;
  image: string | null;
  addedAt: string;
};

export type WishlistApiPayload = {
  wishlist: {
    id: string;
    items: WishlistApiItem[];
  };
};

async function touchWishlistExpiry(wishlistId: string): Promise<void> {
  await db.wishlist.update({
    where: { id: wishlistId },
    data: { expiresAt: wishlistExpiresAt() },
  });
}

async function getOrCreateUserWishlist(userId: string): Promise<string> {
  const existing = await db.wishlist.findUnique({ where: { userId } });
  if (existing) {
    await touchWishlistExpiry(existing.id);
    return existing.id;
  }
  const created = await db.wishlist.create({
    data: {
      userId,
      expiresAt: wishlistExpiresAt(),
    },
  });
  return created.id;
}

/**
 * Resolves guest wishlist: valid session token loads row; invalid/missing token creates a new session.
 */
export async function ensureGuestWishlist(
  sessionToken: string | undefined
): Promise<{ wishlistId: string; sessionToken: string; created: boolean }> {
  if (sessionToken) {
    const row = await db.wishlist.findUnique({
      where: { sessionToken },
    });
    if (row) {
      await touchWishlistExpiry(row.id);
      return { wishlistId: row.id, sessionToken, created: false };
    }
  }
  const token = nanoid(32);
  const createdRow = await db.wishlist.create({
    data: {
      sessionToken: token,
      expiresAt: wishlistExpiresAt(),
    },
  });
  logger.debug("Wishlist: new guest session", { wishlistId: createdRow.id });
  return { wishlistId: createdRow.id, sessionToken: token, created: true };
}

async function assertProductWishlistable(productId: string): Promise<void> {
  const product = await db.product.findFirst({
    where: {
      id: productId,
      published: true,
      deletedAt: null,
    },
    select: { id: true },
  });
  if (!product) {
    throw {
      status: 404,
      type: "https://api.shop.am/problems/not-found",
      title: "Product not found",
      detail: "Product is not available for wishlist",
    };
  }
}

async function addProductToWishlist(wishlistId: string, productId: string): Promise<void> {
  await assertProductWishlistable(productId);
  const count = await db.wishlistItem.count({ where: { wishlistId } });
  if (count >= WISHLIST_MAX_ITEMS) {
    throw {
      status: 422,
      type: "https://api.shop.am/problems/validation-error",
      title: "Wishlist full",
      detail: `Maximum ${WISHLIST_MAX_ITEMS} items allowed`,
    };
  }
  const duplicate = await db.wishlistItem.findUnique({
    where: {
      wishlistId_productId: { wishlistId, productId },
    },
  });
  if (duplicate) {
    return;
  }
  const maxPos = await db.wishlistItem.aggregate({
    where: { wishlistId },
    _max: { position: true },
  });
  const position = (maxPos._max.position ?? -1) + 1;
  await db.wishlistItem.create({
    data: { wishlistId, productId, position },
  });
}

export async function buildWishlistPayload(
  wishlistId: string,
  locale: string
): Promise<WishlistApiPayload> {
  const rows = await db.wishlistItem.findMany({
    where: { wishlistId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    include: {
      product: {
        include: { translations: true },
      },
    },
  });

  const items: WishlistApiItem[] = rows.map((row) => {
    const product = row.product;
    const translation =
      product.translations.find((t) => t.locale === locale) ?? product.translations[0];
    return {
      productId: product.id,
      title: translation?.title ?? "",
      slug: translation?.slug ?? "",
      image: extractMediaUrl(product.media),
      addedAt: row.createdAt.toISOString(),
    };
  });

  return {
    wishlist: {
      id: wishlistId,
      items,
    },
  };
}

export async function getWishlistForUser(
  userId: string,
  locale: string
): Promise<WishlistApiPayload> {
  const wishlistId = await getOrCreateUserWishlist(userId);
  return buildWishlistPayload(wishlistId, locale);
}

export async function addWishlistItemForUser(
  userId: string,
  productId: string,
  locale: string
): Promise<WishlistApiPayload> {
  const wishlistId = await getOrCreateUserWishlist(userId);
  await addProductToWishlist(wishlistId, productId);
  return buildWishlistPayload(wishlistId, locale);
}

export async function removeWishlistItemForUser(
  userId: string,
  productId: string,
  locale: string
): Promise<WishlistApiPayload> {
  const wishlistId = await getOrCreateUserWishlist(userId);
  await db.wishlistItem.deleteMany({
    where: { wishlistId, productId },
  });
  return buildWishlistPayload(wishlistId, locale);
}

export async function getWishlistForGuest(
  sessionToken: string | undefined,
  locale: string
): Promise<{
  payload: WishlistApiPayload;
  sessionToken: string;
  sessionCreated: boolean;
}> {
  const { wishlistId, sessionToken: token, created } = await ensureGuestWishlist(sessionToken);
  const payload = await buildWishlistPayload(wishlistId, locale);
  return { payload, sessionToken: token, sessionCreated: created };
}

export async function addWishlistItemForGuest(
  sessionToken: string | undefined,
  productId: string,
  locale: string
): Promise<{
  payload: WishlistApiPayload;
  sessionToken: string;
  sessionCreated: boolean;
}> {
  const { wishlistId, sessionToken: token, created } = await ensureGuestWishlist(sessionToken);
  await addProductToWishlist(wishlistId, productId);
  const payload = await buildWishlistPayload(wishlistId, locale);
  return { payload, sessionToken: token, sessionCreated: created };
}

export async function removeWishlistItemForGuest(
  sessionToken: string | undefined,
  productId: string,
  locale: string
): Promise<{
  payload: WishlistApiPayload;
  sessionToken: string;
  sessionCreated: boolean;
}> {
  const { wishlistId, sessionToken: token, created } = await ensureGuestWishlist(sessionToken);
  await db.wishlistItem.deleteMany({
    where: { wishlistId, productId },
  });
  const payload = await buildWishlistPayload(wishlistId, locale);
  return { payload, sessionToken: token, sessionCreated: created };
}

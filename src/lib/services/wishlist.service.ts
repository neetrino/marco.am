import { db } from "@white-shop/db";
import {
  WISHLIST_MAX_ITEMS,
  WISHLIST_SESSION_MAX_AGE_SECONDS,
} from "@/lib/constants/wishlist-session";
import { extractMediaUrl } from "@/lib/utils/extractMediaUrl";

const EXPIRY_TOUCH_THRESHOLD_RATIO = 0.5;
const MILLISECONDS_PER_SECOND = 1000;

function wishlistExpiresAt(): Date {
  return new Date(
    Date.now() + WISHLIST_SESSION_MAX_AGE_SECONDS * MILLISECONDS_PER_SECOND
  );
}

type WishlistApiItem = {
  productId: string;
  title: string;
  slug: string;
  image: string | null;
  addedAt: string;
};

type WishlistApiPayload = {
  wishlist: {
    id: string;
    items: WishlistApiItem[];
  };
};

function emptyWishlistPayload(): WishlistApiPayload {
  return {
    wishlist: {
      id: "",
      items: [],
    },
  };
}

async function touchWishlistExpiry(
  wishlistId: string,
  currentExpiresAt: Date
): Promise<void> {
  const touchThresholdMilliseconds =
    WISHLIST_SESSION_MAX_AGE_SECONDS *
    MILLISECONDS_PER_SECOND *
    EXPIRY_TOUCH_THRESHOLD_RATIO;
  if (currentExpiresAt.getTime() - Date.now() >= touchThresholdMilliseconds) {
    return;
  }
  await db.wishlist.update({
    where: { id: wishlistId },
    data: { expiresAt: wishlistExpiresAt() },
  });
}

async function getOrCreateUserWishlist(userId: string): Promise<string> {
  const existing = await db.wishlist.findUnique({ where: { userId } });
  if (existing) {
    await touchWishlistExpiry(existing.id, existing.expiresAt);
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

async function resolveGuestWishlist(
  sessionToken: string | undefined
): Promise<{ wishlistId: string; sessionToken: string } | null> {
  if (!sessionToken) {
    return null;
  }
  const row = await db.wishlist.findUnique({
    where: { sessionToken },
  });
  if (!row) {
    return null;
  }
  await touchWishlistExpiry(row.id, row.expiresAt);
  return { wishlistId: row.id, sessionToken };
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

async function buildWishlistPayload(
  wishlistId: string,
  locale: string,
  fields: "full" | "ids" = "full"
): Promise<WishlistApiPayload> {
  if (fields === "ids") {
    const idRows = await db.wishlistItem.findMany({
      where: { wishlistId },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: { productId: true },
    });
    return {
      wishlist: {
        id: wishlistId,
        items: idRows.map((row) => ({
          productId: row.productId,
          title: "",
          slug: "",
          image: null,
          addedAt: "",
        })),
      },
    };
  }

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
  locale: string,
  fields: "full" | "ids" = "full"
): Promise<WishlistApiPayload> {
  const wishlistId = await getOrCreateUserWishlist(userId);
  return buildWishlistPayload(wishlistId, locale, fields);
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
  locale: string,
  fields: "full" | "ids" = "full"
): Promise<{
  payload: WishlistApiPayload;
  sessionToken?: string;
  sessionExists: boolean;
}> {
  const session = await resolveGuestWishlist(sessionToken);
  if (!session) {
    return { payload: emptyWishlistPayload(), sessionExists: false };
  }
  const payload = await buildWishlistPayload(session.wishlistId, locale, fields);
  return { payload, sessionToken: session.sessionToken, sessionExists: true };
}

export async function removeWishlistItemForGuest(
  sessionToken: string | undefined,
  productId: string,
  locale: string
): Promise<{
  payload: WishlistApiPayload;
  sessionToken?: string;
  sessionExists: boolean;
}> {
  const session = await resolveGuestWishlist(sessionToken);
  if (!session) {
    return { payload: emptyWishlistPayload(), sessionExists: false };
  }
  await db.wishlistItem.deleteMany({
    where: { wishlistId: session.wishlistId, productId },
  });
  const payload = await buildWishlistPayload(session.wishlistId, locale);
  return { payload, sessionToken: session.sessionToken, sessionExists: true };
}

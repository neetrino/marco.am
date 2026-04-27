import { db } from "@white-shop/db";
import { nanoid } from "nanoid";
import {
  COMPARE_MAX_LIST_ITEMS,
  COMPARE_MAX_PER_CATEGORY,
  COMPARE_SESSION_MAX_AGE_SECONDS,
} from "@/lib/constants/compare-session";
import { resolveCompareCategoryId } from "@/lib/compare/compare-category";
import { type ApiLocale } from "@/lib/i18n/api-locale";
import { logger } from "@/lib/utils/logger";
import {
  buildComparePayload,
  type CompareApiPayload,
} from "@/lib/services/compare-payload.service";

function compareExpiresAt(): Date {
  return new Date(Date.now() + COMPARE_SESSION_MAX_AGE_SECONDS * 1000);
}

async function touchCompareExpiry(compareListId: string): Promise<void> {
  await db.compareList.update({
    where: { id: compareListId },
    data: { expiresAt: compareExpiresAt() },
  });
}

async function getOrCreateUserCompareList(userId: string): Promise<string> {
  const existing = await db.compareList.findUnique({ where: { userId } });
  if (existing) {
    await touchCompareExpiry(existing.id);
    return existing.id;
  }
  const created = await db.compareList.create({
    data: {
      userId,
      expiresAt: compareExpiresAt(),
    },
  });
  return created.id;
}

/**
 * Resolves guest compare list: valid session token loads row; invalid/missing token creates a new session.
 */
export async function ensureGuestCompareList(
  sessionToken: string | undefined
): Promise<{ compareListId: string; sessionToken: string; created: boolean }> {
  if (sessionToken) {
    const row = await db.compareList.findUnique({
      where: { sessionToken },
    });
    if (row) {
      await touchCompareExpiry(row.id);
      return { compareListId: row.id, sessionToken, created: false };
    }
  }

  const token = nanoid(32);
  const createdRow = await db.compareList.create({
    data: {
      sessionToken: token,
      expiresAt: compareExpiresAt(),
    },
  });
  logger.debug("Compare: new guest session", { compareListId: createdRow.id });
  return { compareListId: createdRow.id, sessionToken: token, created: true };
}

async function addProductToCompareList(
  compareListId: string,
  productId: string
): Promise<void> {
  const incoming = await db.product.findFirst({
    where: {
      id: productId,
      published: true,
      deletedAt: null,
    },
    select: {
      id: true,
      primaryCategoryId: true,
      categoryIds: true,
    },
  });
  if (!incoming) {
    throw {
      status: 404,
      type: "https://api.shop.am/problems/not-found",
      title: "Product not found",
      detail: "Product is not available for compare",
    };
  }

  const duplicate = await db.compareItem.findUnique({
    where: {
      compareListId_productId: { compareListId, productId },
    },
  });
  if (duplicate) {
    return;
  }

  const total = await db.compareItem.count({ where: { compareListId } });
  if (total >= COMPARE_MAX_LIST_ITEMS) {
    throw {
      status: 422,
      type: "https://api.shop.am/problems/validation-error",
      title: "Compare list full",
      detail: `Maximum ${COMPARE_MAX_LIST_ITEMS} products in compare`,
    };
  }

  const incomingKey = resolveCompareCategoryId(incoming);
  const existingRows = await db.compareItem.findMany({
    where: { compareListId },
    select: {
      product: {
        select: {
          primaryCategoryId: true,
          categoryIds: true,
        },
      },
    },
  });
  const sameCategoryCount = existingRows.filter(
    (row) => resolveCompareCategoryId(row.product) === incomingKey
  ).length;
  if (sameCategoryCount >= COMPARE_MAX_PER_CATEGORY) {
    throw {
      status: 422,
      type: "https://api.shop.am/problems/validation-error",
      title: "Compare category full",
      detail: `Maximum ${COMPARE_MAX_PER_CATEGORY} products per category in compare`,
    };
  }

  const maxPos = await db.compareItem.aggregate({
    where: { compareListId },
    _max: { position: true },
  });
  const position = (maxPos._max.position ?? -1) + 1;

  await db.compareItem.create({
    data: { compareListId, productId, position },
  });
}

export async function getCompareForUser(
  userId: string,
  locale: ApiLocale
): Promise<CompareApiPayload> {
  const compareListId = await getOrCreateUserCompareList(userId);
  return buildComparePayload(compareListId, locale);
}

export async function addCompareItemForUser(
  userId: string,
  productId: string,
  locale: ApiLocale
): Promise<CompareApiPayload> {
  const compareListId = await getOrCreateUserCompareList(userId);
  await addProductToCompareList(compareListId, productId);
  return buildComparePayload(compareListId, locale);
}

export async function removeCompareItemForUser(
  userId: string,
  productId: string,
  locale: ApiLocale
): Promise<CompareApiPayload> {
  const compareListId = await getOrCreateUserCompareList(userId);
  await db.compareItem.deleteMany({
    where: { compareListId, productId },
  });
  return buildComparePayload(compareListId, locale);
}

export async function getCompareForGuest(
  sessionToken: string | undefined,
  locale: ApiLocale
): Promise<{
  payload: CompareApiPayload;
  sessionToken: string;
  sessionCreated: boolean;
}> {
  const { compareListId, sessionToken: token, created } =
    await ensureGuestCompareList(sessionToken);
  const payload = await buildComparePayload(compareListId, locale);
  return { payload, sessionToken: token, sessionCreated: created };
}

export async function addCompareItemForGuest(
  sessionToken: string | undefined,
  productId: string,
  locale: ApiLocale
): Promise<{
  payload: CompareApiPayload;
  sessionToken: string;
  sessionCreated: boolean;
}> {
  const { compareListId, sessionToken: token, created } =
    await ensureGuestCompareList(sessionToken);
  await addProductToCompareList(compareListId, productId);
  const payload = await buildComparePayload(compareListId, locale);
  return { payload, sessionToken: token, sessionCreated: created };
}

export async function removeCompareItemForGuest(
  sessionToken: string | undefined,
  productId: string,
  locale: ApiLocale
): Promise<{
  payload: CompareApiPayload;
  sessionToken: string;
  sessionCreated: boolean;
}> {
  const { compareListId, sessionToken: token, created } =
    await ensureGuestCompareList(sessionToken);
  await db.compareItem.deleteMany({
    where: { compareListId, productId },
  });
  const payload = await buildComparePayload(compareListId, locale);
  return { payload, sessionToken: token, sessionCreated: created };
}

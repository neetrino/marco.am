import { db } from "@white-shop/db";

import {
  REELS_MANAGEMENT_SETTINGS_KEY,
  REELS_POSTER_FALLBACK_SRC,
  REELS_MANAGEMENT_STORAGE_VERSION,
} from "@/lib/constants/reels-management";
import {
  type ReelModerationPatch,
  type PublicReelItem,
  type ReelsPublicPayload,
  reelsPublicPayloadSchema,
  reelsManagementStorageSchema,
  type ReelsManagementStorage,
} from "@/lib/schemas/reels-management.schema";
import { resolveApiLocale, type ApiLocale } from "@/lib/i18n/api-locale";
import { AppError } from "@/lib/types/errors";
import {
  getCachedJson,
  invalidateReelsPublicCache,
} from "@/lib/services/read-through-json-cache";
import { logger } from "@/lib/utils/logger";

const REELS_PUBLIC_CACHE_TTL_SEC = 120;

const DEFAULT_STORAGE: ReelsManagementStorage = {
  version: REELS_MANAGEMENT_STORAGE_VERSION,
  items: [],
};

function normalizeLocale(
  localeRaw: string | undefined,
  acceptLanguageRaw: string | null | undefined,
): ApiLocale {
  return resolveApiLocale({
    localeRaw,
    acceptLanguageRaw,
    fallbackLocale: "hy",
  }).resolvedLocale;
}

function parseStored(raw: unknown): ReelsManagementStorage | null {
  const parsed = reelsManagementStorageSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn("[reelsManagement] Invalid stored payload", parsed.error.flatten());
    return null;
  }
  return parsed.data;
}

function isPrismaPoolTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  return error.message.includes("Timed out fetching a new connection from the connection pool");
}

async function loadStorage(): Promise<ReelsManagementStorage> {
  try {
    const row = await db.settings.findUnique({
      where: { key: REELS_MANAGEMENT_SETTINGS_KEY },
    });
    if (!row) {
      return DEFAULT_STORAGE;
    }
    return parseStored(row.value) ?? DEFAULT_STORAGE;
  } catch (error) {
    if (!isPrismaPoolTimeoutError(error)) {
      throw error;
    }
    logger.error(
      "[reelsManagement] Prisma pool timeout while loading settings. Falling back to default reels payload.",
      error,
    );
    return DEFAULT_STORAGE;
  }
}

function normalizeSettingsAssetUrl(url: string | null): string | null {
  if (url === null) {
    return null;
  }
  const trimmed = url.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function resolvePublicPoster(posterUrl: string | null): string {
  const normalized = normalizeSettingsAssetUrl(posterUrl);
  return normalized ?? REELS_POSTER_FALLBACK_SRC;
}

function isAdminAssetUrl(raw: string): boolean {
  const value = raw.trim();
  if (value.startsWith("/")) {
    return true;
  }

  const r2PublicBase = process.env.R2_PUBLIC_URL?.trim().replace(/\/$/, "");
  if (r2PublicBase === undefined || r2PublicBase.length === 0) {
    return false;
  }
  return value.startsWith(r2PublicBase);
}

function ensureSourceUrlPolicy(storage: ReelsManagementStorage): void {
  for (const item of storage.items) {
    if (item.sourceType !== "admin_upload") {
      continue;
    }

    if (!isAdminAssetUrl(item.videoUrl)) {
      throw new AppError(
        `Invalid admin-upload video URL for reel ${item.id}`,
        400,
        "https://api.shop.am/problems/validation-error",
        "Validation Error",
        "Admin-upload reel videoUrl must be R2_PUBLIC_URL-based or absolute local path",
      );
    }

    if (item.posterUrl !== null && !isAdminAssetUrl(item.posterUrl)) {
      throw new AppError(
        `Invalid admin-upload poster URL for reel ${item.id}`,
        400,
        "https://api.shop.am/problems/validation-error",
        "Validation Error",
        "Admin-upload reel posterUrl must be R2_PUBLIC_URL-based or absolute local path",
      );
    }
  }
}

function toPublicItems(
  storage: ReelsManagementStorage,
  locale: ApiLocale,
): PublicReelItem[] {
  return storage.items
    .filter((item) => item.active)
    .filter((item) => item.moderation.status === "approved")
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
    .map((item) => ({
      id: item.id,
      title: item.title[locale].trim(),
      url: item.videoUrl,
      poster: normalizeSettingsAssetUrl(item.posterUrl),
      order: item.sortOrder,
      videoUrl: item.videoUrl,
      posterUrl: resolvePublicPoster(item.posterUrl),
      sortOrder: item.sortOrder,
      likesCount: 0,
      likedByCurrentUser: false,
    }));
}

async function saveStorage(
  payload: ReelsManagementStorage,
): Promise<ReelsManagementStorage> {
  ensureSourceUrlPolicy(payload);

  await db.settings.upsert({
    where: { key: REELS_MANAGEMENT_SETTINGS_KEY },
    update: {
      value: payload as object,
      updatedAt: new Date(),
      description:
        "Reels feed config: source type (admin upload/external), URL metadata, moderation status",
    },
    create: {
      key: REELS_MANAGEMENT_SETTINGS_KEY,
      value: payload as object,
      description:
        "Reels feed config: source type (admin upload/external), URL metadata, moderation status",
    },
  });

  await invalidateReelsPublicCache();
  return payload;
}

export const reelsManagementService = {
  getDefaultStorage(): ReelsManagementStorage {
    return DEFAULT_STORAGE;
  },

  async getAdminStorage(): Promise<ReelsManagementStorage> {
    return loadStorage();
  },

  async updateAdminStorage(
    payload: ReelsManagementStorage,
  ): Promise<ReelsManagementStorage> {
    const parsed = reelsManagementStorageSchema.parse(payload);
    return saveStorage(parsed);
  },

  async patchModeration(args: {
    reelId: string;
    patch: ReelModerationPatch;
    moderatorUserId: string;
  }): Promise<ReelsManagementStorage> {
    const storage = await loadStorage();
    const reel = storage.items.find((item) => item.id === args.reelId);
    if (!reel) {
      throw new AppError(
        `Reel ${args.reelId} not found`,
        404,
        "https://api.shop.am/problems/not-found",
        "Not Found",
        "Reel item was not found",
      );
    }

    reel.moderation.status = args.patch.status;
    reel.moderation.note =
      args.patch.note === undefined ? reel.moderation.note : args.patch.note;

    if (args.patch.status === "pending") {
      reel.moderation.moderatedAt = null;
      reel.moderation.moderatedBy = null;
    } else {
      reel.moderation.moderatedAt = new Date().toISOString();
      reel.moderation.moderatedBy = args.moderatorUserId;
    }

    return saveStorage(storage);
  },

  async getPublicPayload(args: {
    localeRaw?: string | undefined;
    acceptLanguageRaw?: string | null;
  }): Promise<ReelsPublicPayload> {
    const locale = normalizeLocale(args.localeRaw, args.acceptLanguageRaw);
    const cacheKey = `reels:public:v1:${locale}`;

    return getCachedJson(cacheKey, REELS_PUBLIC_CACHE_TTL_SEC, async () => {
      const storage = await loadStorage();
      return reelsPublicPayloadSchema.parse({
        generatedAt: new Date().toISOString(),
        viewer: {
          likedReelsCount: 0,
        },
        items: toPublicItems(storage, locale),
      });
    });
  },
};

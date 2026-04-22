import { db } from "@white-shop/db";

import {
  REELS_LIKES_SETTINGS_KEY,
  REELS_LIKES_STORAGE_VERSION,
} from "@/lib/constants/reels-management";
import {
  reelsLikesStorageSchema,
  type ReelsLikesStorage,
} from "@/lib/schemas/reels-management.schema";
import { AppError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

import { reelsManagementService } from "./reels-management.service";

const DEFAULT_LIKES_STORAGE: ReelsLikesStorage = {
  version: REELS_LIKES_STORAGE_VERSION,
  items: [],
};

export type ReelsLikesSnapshot = {
  likesByReelId: Record<string, number>;
  viewerLikedReelIds: Set<string>;
  viewerLikedReelsCount: number;
};

export type ReelsLikesByReelId = Record<string, number>;

function parseLikesStorage(raw: unknown): ReelsLikesStorage | null {
  const parsed = reelsLikesStorageSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn("[reelsLikes] Invalid stored payload", parsed.error.flatten());
    return null;
  }
  return parsed.data;
}

function normalizeUserIds(userIds: string[]): string[] {
  return Array.from(new Set(userIds.map((value) => value.trim()).filter((value) => value.length > 0)));
}

function filterStorageToLikeableReels(
  storage: ReelsLikesStorage,
  likeableReelIds: Set<string>,
): ReelsLikesStorage {
  const items = storage.items
    .filter((item) => likeableReelIds.has(item.reelId))
    .map((item) => ({
      reelId: item.reelId,
      userIds: normalizeUserIds(item.userIds),
    }))
    .filter((item) => item.userIds.length > 0);

  return {
    version: REELS_LIKES_STORAGE_VERSION,
    items,
  };
}

async function loadLikesStorage(): Promise<ReelsLikesStorage> {
  const row = await db.settings.findUnique({
    where: { key: REELS_LIKES_SETTINGS_KEY },
  });
  if (!row) {
    return DEFAULT_LIKES_STORAGE;
  }
  return parseLikesStorage(row.value) ?? DEFAULT_LIKES_STORAGE;
}

async function saveLikesStorage(storage: ReelsLikesStorage): Promise<ReelsLikesStorage> {
  const parsed = reelsLikesStorageSchema.parse(storage);
  await db.settings.upsert({
    where: { key: REELS_LIKES_SETTINGS_KEY },
    update: {
      value: parsed as object,
      updatedAt: new Date(),
      description: "Reels likes: per-reel user like ids",
    },
    create: {
      key: REELS_LIKES_SETTINGS_KEY,
      value: parsed as object,
      description: "Reels likes: per-reel user like ids",
    },
  });
  return parsed;
}

async function getLikeableReelIdSet(): Promise<Set<string>> {
  const storage = await reelsManagementService.getAdminStorage();
  const ids = storage.items
    .filter((item) => item.active)
    .filter((item) => item.moderation.status === "approved")
    .map((item) => item.id);
  return new Set(ids);
}

async function assertReelLikeable(reelId: string): Promise<void> {
  const likeable = await getLikeableReelIdSet();
  if (!likeable.has(reelId)) {
    throw new AppError(
      `Reel ${reelId} is not available for likes`,
      404,
      "https://api.shop.am/problems/not-found",
      "Not Found",
      "Reel item was not found or not available in public feed",
    );
  }
}

export const reelsLikesService = {
  async getAdminLikesByReelId(): Promise<ReelsLikesByReelId> {
    const storage = await loadLikesStorage();
    const likesByReelId: ReelsLikesByReelId = {};

    for (const item of storage.items) {
      likesByReelId[item.reelId] = normalizeUserIds(item.userIds).length;
    }

    return likesByReelId;
  },

  async getLikesSnapshot(args: {
    reelIds: string[];
    viewerUserId?: string;
  }): Promise<ReelsLikesSnapshot> {
    const storage = await loadLikesStorage();
    const likesByReelId: Record<string, number> = {};
    const viewerLikedReelIds = new Set<string>();
    const reelIdSet = new Set(args.reelIds);

    for (const reelId of reelIdSet) {
      likesByReelId[reelId] = 0;
    }

    for (const item of storage.items) {
      if (!reelIdSet.has(item.reelId)) {
        continue;
      }
      const uniqueUserIds = normalizeUserIds(item.userIds);
      likesByReelId[item.reelId] = uniqueUserIds.length;
      if (args.viewerUserId && uniqueUserIds.includes(args.viewerUserId)) {
        viewerLikedReelIds.add(item.reelId);
      }
    }

    return {
      likesByReelId,
      viewerLikedReelIds,
      viewerLikedReelsCount: viewerLikedReelIds.size,
    };
  },

  async setUserLike(args: {
    reelId: string;
    userId: string;
    liked: boolean;
  }): Promise<{ reelId: string; likesCount: number; likedByCurrentUser: boolean }> {
    await assertReelLikeable(args.reelId);
    const likeableReels = await getLikeableReelIdSet();
    const loadedStorage = await loadLikesStorage();
    const storage = filterStorageToLikeableReels(loadedStorage, likeableReels);
    const current = storage.items.find((item) => item.reelId === args.reelId);

    if (!current && args.liked) {
      storage.items.push({ reelId: args.reelId, userIds: [args.userId] });
    } else if (current) {
      const userIds = new Set(current.userIds);
      if (args.liked) {
        userIds.add(args.userId);
      } else {
        userIds.delete(args.userId);
      }
      current.userIds = Array.from(userIds);
    }

    storage.items = storage.items.filter((item) => item.userIds.length > 0);
    const saved = await saveLikesStorage(storage);
    const savedItem = saved.items.find((item) => item.reelId === args.reelId);
    return {
      reelId: args.reelId,
      likesCount: savedItem?.userIds.length ?? 0,
      likedByCurrentUser: args.liked,
    };
  },
};

import { db } from "@white-shop/db";

import {
  REELS_VIEWS_SETTINGS_KEY,
  REELS_VIEWS_STORAGE_VERSION,
} from "@/lib/constants/reels-management";
import {
  reelsViewsStorageSchema,
  type ReelsViewsStorage,
} from "@/lib/schemas/reels-management.schema";
import { AppError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

import { reelsManagementService } from "./reels-management.service";

const DEFAULT_VIEWS_STORAGE: ReelsViewsStorage = {
  version: REELS_VIEWS_STORAGE_VERSION,
  items: [],
};

function parseViewsStorage(raw: unknown): ReelsViewsStorage | null {
  const parsed = reelsViewsStorageSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn("[reelsViews] Invalid stored payload", parsed.error.flatten());
    return null;
  }
  return parsed.data;
}

async function loadViewsStorage(): Promise<ReelsViewsStorage> {
  const row = await db.settings.findUnique({
    where: { key: REELS_VIEWS_SETTINGS_KEY },
  });
  if (!row) {
    return DEFAULT_VIEWS_STORAGE;
  }
  return parseViewsStorage(row.value) ?? DEFAULT_VIEWS_STORAGE;
}

async function saveViewsStorage(storage: ReelsViewsStorage): Promise<ReelsViewsStorage> {
  const parsed = reelsViewsStorageSchema.parse(storage);
  await db.settings.upsert({
    where: { key: REELS_VIEWS_SETTINGS_KEY },
    update: {
      value: parsed as object,
      updatedAt: new Date(),
      description: "Reels views: per-reel counters",
    },
    create: {
      key: REELS_VIEWS_SETTINGS_KEY,
      value: parsed as object,
      description: "Reels views: per-reel counters",
    },
  });
  return parsed;
}

async function getViewableReelIdSet(): Promise<Set<string>> {
  const storage = await reelsManagementService.getAdminStorage();
  const ids = storage.items
    .filter((item) => item.active)
    .filter((item) => item.moderation.status === "approved")
    .map((item) => item.id);
  return new Set(ids);
}

async function assertReelViewable(reelId: string): Promise<void> {
  const viewable = await getViewableReelIdSet();
  if (!viewable.has(reelId)) {
    throw new AppError(
      `Reel ${reelId} is not available for views`,
      404,
      "https://api.shop.am/problems/not-found",
      "Not Found",
      "Reel item was not found or not available in public feed",
    );
  }
}

export const reelsViewsService = {
  async getAdminViewsByReelId(): Promise<Record<string, number>> {
    const storage = await loadViewsStorage();
    const viewable = await getViewableReelIdSet();
    const viewsByReelId: Record<string, number> = {};

    for (const item of storage.items) {
      if (!viewable.has(item.reelId)) {
        continue;
      }
      viewsByReelId[item.reelId] = item.count;
    }

    return viewsByReelId;
  },

  async registerView(args: { reelId: string }): Promise<{ reelId: string; viewsCount: number }> {
    await assertReelViewable(args.reelId);
    const storage = await loadViewsStorage();
    const current = storage.items.find((item) => item.reelId === args.reelId);

    if (!current) {
      storage.items.push({ reelId: args.reelId, count: 1 });
    } else {
      current.count += 1;
    }

    const saved = await saveViewsStorage(storage);
    const savedItem = saved.items.find((item) => item.reelId === args.reelId);
    return {
      reelId: args.reelId,
      viewsCount: savedItem?.count ?? 0,
    };
  },
};

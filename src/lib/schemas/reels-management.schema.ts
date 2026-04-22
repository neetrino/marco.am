import { z } from "zod";

import {
  REEL_MODERATION_STATUSES,
  REEL_SOURCE_TYPES,
  REELS_LIKES_STORAGE_VERSION,
  REELS_MANAGEMENT_MAX_ITEMS,
  REELS_MANAGEMENT_MODERATION_NOTE_MAX_LENGTH,
  REELS_MANAGEMENT_STORAGE_VERSION,
  REELS_VIEWS_STORAGE_VERSION,
} from "@/lib/constants/reels-management";
import { buildLocalizedTextMapSchema } from "@/lib/schemas/locale-map.schema";

const localeLabelSchema = buildLocalizedTextMapSchema({ max: 160 });

const urlSchema = z.string().min(1).max(2048);

function isHttpsUrl(raw: string): boolean {
  try {
    const value = new URL(raw);
    return value.protocol === "https:";
  } catch {
    return false;
  }
}

export const reelModerationStatusSchema = z.enum(REEL_MODERATION_STATUSES);

export const reelSourceTypeSchema = z.enum(REEL_SOURCE_TYPES);

const moderationSchema = z
  .object({
    status: reelModerationStatusSchema,
    note: z
      .union([z.string().max(REELS_MANAGEMENT_MODERATION_NOTE_MAX_LENGTH), z.null()])
      .optional(),
    moderatedAt: z.union([z.string().datetime({ offset: true }), z.null()]),
    moderatedBy: z.union([z.string().min(1).max(64), z.null()]),
  })
  .superRefine((value, ctx) => {
    if (value.status === "pending") {
      return;
    }

    if (value.moderatedAt === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "moderatedAt is required once moderation is finalized",
        path: ["moderatedAt"],
      });
    }
    if (value.moderatedBy === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "moderatedBy is required once moderation is finalized",
        path: ["moderatedBy"],
      });
    }
  });

export const reelItemSchema = z
  .object({
    id: z.string().min(1).max(64),
    title: localeLabelSchema,
    sourceType: reelSourceTypeSchema,
    videoUrl: urlSchema,
    posterUrl: z.union([urlSchema, z.null()]),
    active: z.boolean(),
    sortOrder: z.number().int().min(0).max(9999),
    moderation: moderationSchema,
  })
  .superRefine((value, ctx) => {
    if (value.sourceType === "external_url" && !isHttpsUrl(value.videoUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "External reels must use an HTTPS video URL",
        path: ["videoUrl"],
      });
    }

    if (
      value.posterUrl !== null &&
      value.sourceType === "external_url" &&
      !isHttpsUrl(value.posterUrl) &&
      !value.posterUrl.startsWith("/")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "External reels posterUrl must be HTTPS or absolute local path",
        path: ["posterUrl"],
      });
    }
  });

export const reelsManagementStorageSchema = z.object({
  version: z.literal(REELS_MANAGEMENT_STORAGE_VERSION),
  items: z.array(reelItemSchema).max(REELS_MANAGEMENT_MAX_ITEMS),
});

const reelLikesEntrySchema = z.object({
  reelId: z.string().min(1).max(64),
  userIds: z.array(z.string().min(1).max(64)),
});

export const reelsLikesStorageSchema = z.object({
  version: z.literal(REELS_LIKES_STORAGE_VERSION),
  items: z.array(reelLikesEntrySchema).max(REELS_MANAGEMENT_MAX_ITEMS),
});

const reelViewsEntrySchema = z.object({
  reelId: z.string().min(1).max(64),
  count: z.number().int().min(0),
});

export const reelsViewsStorageSchema = z.object({
  version: z.literal(REELS_VIEWS_STORAGE_VERSION),
  items: z.array(reelViewsEntrySchema).max(REELS_MANAGEMENT_MAX_ITEMS),
});

export const publicReelItemSchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().max(160),
  /** Canonical URL fields for vertical feed clients. */
  url: urlSchema,
  poster: z.union([urlSchema, z.null()]),
  order: z.number().int().min(0).max(9999),
  /**
   * Backward-compatible aliases kept for existing clients.
   * New consumers should prefer `url` / `poster` / `order`.
   */
  videoUrl: urlSchema,
  posterUrl: urlSchema,
  sortOrder: z.number().int().min(0).max(9999),
  likesCount: z.number().int().min(0),
  likedByCurrentUser: z.boolean(),
});

export const reelsPublicPayloadSchema = z.object({
  generatedAt: z.string().datetime({ offset: true }),
  viewer: z.object({
    likedReelsCount: z.number().int().min(0),
  }),
  items: z.array(publicReelItemSchema),
});

export const reelsModerationPatchSchema = z.object({
  status: reelModerationStatusSchema,
  note: z
    .union([z.string().max(REELS_MANAGEMENT_MODERATION_NOTE_MAX_LENGTH), z.null()])
    .optional(),
});

export type ReelsManagementStorage = z.infer<typeof reelsManagementStorageSchema>;
export type ReelsLikesStorage = z.infer<typeof reelsLikesStorageSchema>;
export type ReelsViewsStorage = z.infer<typeof reelsViewsStorageSchema>;
export type ReelModerationPatch = z.infer<typeof reelsModerationPatchSchema>;
export type PublicReelItem = z.infer<typeof publicReelItemSchema>;
export type ReelsPublicPayload = z.infer<typeof reelsPublicPayloadSchema>;

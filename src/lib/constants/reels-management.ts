/** Settings key for admin-managed reels feed configuration. */
export const REELS_MANAGEMENT_SETTINGS_KEY = "reels" as const;

/** Settings key for reels likes state (per reel and per user). */
export const REELS_LIKES_SETTINGS_KEY = "reels_likes" as const;

/** Settings key for reels views counters (per reel). */
export const REELS_VIEWS_SETTINGS_KEY = "reels_views" as const;

/** Stored payload version for future migrations. */
export const REELS_MANAGEMENT_STORAGE_VERSION = 1 as const;

/** Stored payload version for reels likes state. */
export const REELS_LIKES_STORAGE_VERSION = 1 as const;

/** Stored payload version for reels views state. */
export const REELS_VIEWS_STORAGE_VERSION = 1 as const;

/** Max reels items in one admin document. */
export const REELS_MANAGEMENT_MAX_ITEMS = 200 as const;

/** Max moderation note length for one reel item. */
export const REELS_MANAGEMENT_MODERATION_NOTE_MAX_LENGTH = 500 as const;

/** Source of the reel video URL. */
export const REEL_SOURCE_TYPES = ["admin_upload", "external_url"] as const;

/** Moderation lifecycle states for a reel item. */
export const REEL_MODERATION_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;

/** Used when reel poster metadata is missing for the feed card/video placeholder. */
export const REELS_POSTER_FALLBACK_SRC = "/images/home/reels/reel-1.png" as const;

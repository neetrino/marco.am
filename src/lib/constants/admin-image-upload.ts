export const ADMIN_IMAGE_MIME = 'image/webp' as const;
export const ADMIN_IMAGE_ACCEPT = 'image/*' as const;

export type AdminImageUploadProfile = 'catalog' | 'banner' | 'logo';

/** Client-side compression targets (browser-image-compression). */
export const ADMIN_IMAGE_PROCESS_OPTIONS: Record<
  AdminImageUploadProfile,
  { maxSizeMB: number; maxWidthOrHeight: number; initialQuality: number }
> = {
  catalog: { maxSizeMB: 0.15, maxWidthOrHeight: 1200, initialQuality: 0.82 },
  banner: { maxSizeMB: 0.4, maxWidthOrHeight: 1920, initialQuality: 0.82 },
  logo: { maxSizeMB: 0.15, maxWidthOrHeight: 800, initialQuality: 0.85 },
};

/** Hard server-side cap after base64 decode (bytes). */
export const ADMIN_IMAGE_MAX_BYTES: Record<AdminImageUploadProfile, number> = {
  catalog: 200 * 1024,
  banner: 512 * 1024,
  logo: 200 * 1024,
};

/** Max raw image file before client conversion/compression (sanity limit). */
export const ADMIN_IMAGE_MAX_RAW_BYTES: Record<AdminImageUploadProfile, number> = {
  catalog: 2 * 1024 * 1024,
  banner: 3 * 1024 * 1024,
  logo: 1 * 1024 * 1024,
};

export const MAX_ADMIN_IMAGE_COUNT = 12;

/**
 * Diagnostics helpers for admin product list image resolution.
 * Keeps verbose explain/trace out of the hot-path resolver module.
 */

import {
  normalizeAdminListImageUrl,
  resolveAdminProductListImageUrl,
} from '@/lib/admin/admin-list-product-image';

type ListVariantImageSource = {
  imageUrl?: string | null;
  price?: number;
  published?: boolean;
  sku?: string | null;
};

export type AdminListImageResolveInput = {
  media?: unknown;
  variants?: readonly ListVariantImageSource[];
  listingRowImage?: string | null;
};

export type AdminListImageCandidateTrace = {
  source:
    | 'primary_media'
    | 'first_valid_media'
    | 'primary_variant'
    | 'any_published_variant'
    | 'listing_row'
    | 'none';
  accepted: boolean;
  reason: string;
  urlPreview: string | null;
};

function previewUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.toLowerCase().startsWith('data:')) {
    return 'data:…';
  }
  if (/^[A-Za-z0-9+/=\s]{80,}$/.test(trimmed) && !trimmed.includes('/')) {
    return 'base64:…';
  }
  return trimmed.length > 120 ? `${trimmed.slice(0, 120)}…` : trimmed;
}

function extractRawMediaUrl(item: unknown): string | null {
  if (typeof item === 'string') {
    const trimmed = item.trim();
    return trimmed || null;
  }
  if (!item || typeof item !== 'object') {
    return null;
  }
  const raw = item as { url?: string; src?: string; value?: string };
  const candidate = raw.url ?? raw.src ?? raw.value;
  if (typeof candidate !== 'string') {
    return null;
  }
  const trimmed = candidate.trim();
  return trimmed || null;
}

function mediaUrlPreviews(media: unknown): string[] {
  if (!Array.isArray(media)) {
    return [];
  }
  return media.map((item) => previewUrl(extractRawMediaUrl(item)) ?? '∅');
}

/**
 * Explain why each image candidate was accepted or rejected for admin list.
 */
export function explainAdminProductListImageResolution(
  input: AdminListImageResolveInput,
): { image: string | null; candidates: AdminListImageCandidateTrace[]; mediaPreviews: string[] } {
  const media = input.media;
  const variants = input.variants ?? [];
  const listingRowImage = input.listingRowImage ?? null;
  const image = resolveAdminProductListImageUrl(media, variants, listingRowImage);
  const candidates: AdminListImageCandidateTrace[] = [];

  const mediaItems = Array.isArray(media) ? media : [];
  const primaryRaw = mediaItems.length > 0 ? extractRawMediaUrl(mediaItems[0]) : null;
  const primaryNorm = normalizeAdminListImageUrl(primaryRaw);
  candidates.push({
    source: 'primary_media',
    accepted: Boolean(primaryNorm) && image === primaryNorm,
    reason: primaryNorm
      ? image === primaryNorm
        ? 'accepted'
        : 'valid but not selected (higher priority unused)'
      : mediaItems.length > 0
        ? 'rejected (data:/blob:/invalid)'
        : 'media empty',
    urlPreview: previewUrl(primaryRaw),
  });

  let firstValidMedia: string | null = null;
  for (const item of mediaItems) {
    const normalized = normalizeAdminListImageUrl(extractRawMediaUrl(item));
    if (normalized) {
      firstValidMedia = normalized;
      break;
    }
  }
  candidates.push({
    source: 'first_valid_media',
    accepted: Boolean(firstValidMedia) && image === firstValidMedia && !primaryNorm,
    reason: firstValidMedia
      ? image === firstValidMedia
        ? 'accepted'
        : 'valid but not selected'
      : 'no valid media URL',
    urlPreview: previewUrl(firstValidMedia),
  });

  const published = variants.filter((variant) => variant.published !== false);
  const primaryVariant = published[0] ?? variants[0] ?? null;
  const primaryVariantNorm = normalizeAdminListImageUrl(primaryVariant?.imageUrl ?? null);
  candidates.push({
    source: 'primary_variant',
    accepted: Boolean(primaryVariantNorm) && image === primaryVariantNorm,
    reason: primaryVariantNorm
      ? image === primaryVariantNorm
        ? 'accepted'
        : 'valid but not selected'
      : primaryVariant?.imageUrl
        ? 'rejected'
        : 'missing imageUrl',
    urlPreview: previewUrl(primaryVariantNorm ?? primaryVariant?.imageUrl ?? null),
  });

  let anyVariant: string | null = null;
  for (const variant of published) {
    const normalized = normalizeAdminListImageUrl(variant.imageUrl ?? null);
    if (normalized) {
      anyVariant = normalized;
      break;
    }
  }
  candidates.push({
    source: 'any_published_variant',
    accepted: Boolean(anyVariant) && image === anyVariant,
    reason: anyVariant
      ? image === anyVariant
        ? 'accepted'
        : 'valid but not selected'
      : 'no valid published variant imageUrl',
    urlPreview: previewUrl(anyVariant),
  });

  const listingNorm = normalizeAdminListImageUrl(listingRowImage);
  candidates.push({
    source: 'listing_row',
    accepted: Boolean(listingNorm) && image === listingNorm,
    reason: listingNorm
      ? image === listingNorm
        ? 'accepted'
        : 'valid but not selected'
      : listingRowImage
        ? 'rejected (data:/blob:/invalid)'
        : 'missing',
    urlPreview: previewUrl(listingNorm ?? listingRowImage),
  });

  if (!image) {
    candidates.push({
      source: 'none',
      accepted: false,
      reason: 'no valid image source',
      urlPreview: null,
    });
  }

  return { image, candidates, mediaPreviews: mediaUrlPreviews(media) };
}

import {
  normalizeUrlForComparison,
  processImageUrl,
  smartSplitUrls,
} from '@/lib/utils/image-utils';

export type ProductGalleryVariantInput = {
  imageUrl?: string | null;
};

type RawProductMediaItem = {
  url?: string;
  src?: string;
  value?: string;
  position?: number | string;
  sortOrder?: number | string;
};

function parseNumericMetadata(value: number | string | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function collectVariantImageSet(variants: readonly ProductGalleryVariantInput[]): Set<string> {
  const variantImageSet = new Set<string>();

  for (const variant of variants) {
    if (!variant.imageUrl) {
      continue;
    }
    const urls = smartSplitUrls(variant.imageUrl);
    for (const rawUrl of urls) {
      const processedUrl = processImageUrl(rawUrl);
      if (processedUrl) {
        variantImageSet.add(normalizeUrlForComparison(processedUrl));
      }
    }
  }

  return variantImageSet;
}

function readMediaSortOrder(rawItem: RawProductMediaItem): number {
  const positionCandidate = parseNumericMetadata(rawItem.position ?? rawItem.sortOrder);
  return positionCandidate ?? Number.MAX_SAFE_INTEGER;
}

function toGalleryUrlEntry(
  mediaItem: unknown,
  variantImageSet: Set<string>,
): { url: string; sortOrder: number } | null {
  let rawItem: RawProductMediaItem = {};
  let sourceUrl: string | null = null;

  if (typeof mediaItem === 'string') {
    sourceUrl = mediaItem;
  } else if (mediaItem && typeof mediaItem === 'object') {
    rawItem = mediaItem as RawProductMediaItem;
    sourceUrl = rawItem.url ?? rawItem.src ?? rawItem.value ?? null;
  }

  const processedUrl = processImageUrl(sourceUrl);
  if (!processedUrl) {
    return null;
  }

  if (variantImageSet.has(normalizeUrlForComparison(processedUrl))) {
    return null;
  }

  return {
    url: processedUrl,
    sortOrder: readMediaSortOrder(rawItem),
  };
}

/**
 * Canonical PDP/PLP gallery URLs — excludes variant-only duplicates and dedupes by URL.
 */
export function buildProductGalleryUrls(
  media: unknown,
  variants: readonly ProductGalleryVariantInput[] = [],
): string[] {
  if (!Array.isArray(media)) {
    return [];
  }

  const variantImageSet = collectVariantImageSet(variants);
  const galleryWithOrder: Array<{ url: string; sortOrder: number }> = [];

  for (const mediaItem of media) {
    const entry = toGalleryUrlEntry(mediaItem, variantImageSet);
    if (entry) {
      galleryWithOrder.push(entry);
    }
  }

  galleryWithOrder.sort((left, right) => left.sortOrder - right.sortOrder);

  const deduplicated: string[] = [];
  const seenUrls = new Set<string>();

  for (const { url } of galleryWithOrder) {
    const normalizedUrl = normalizeUrlForComparison(url);
    if (seenUrls.has(normalizedUrl)) {
      continue;
    }
    seenUrls.add(normalizedUrl);
    deduplicated.push(url);
  }

  return deduplicated;
}

/** First card/listing hero — same as PDP gallery index 0. */
export function resolveListingHeroImageUrl(
  media: unknown,
  variants: readonly ProductGalleryVariantInput[] = [],
): string | null {
  return buildProductGalleryUrls(media, variants)[0] ?? null;
}

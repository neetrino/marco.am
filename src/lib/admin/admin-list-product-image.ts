/**
 * Admin products-list thumbnail URL resolution.
 * List payloads never embed base64/`data:` images — only http(s) or site-relative paths.
 */

type ListVariantImageSource = {
  imageUrl?: string | null;
  price?: number;
  published?: boolean;
};

type RawMediaObject = {
  url?: string;
  src?: string;
  value?: string;
  position?: number | string;
  sortOrder?: number | string;
};

const RAW_BASE64_PATTERN = /^[A-Za-z0-9+/=\s]{80,}$/;

function parseSortOrder(value: number | string | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return Number.MAX_SAFE_INTEGER;
}

function extractRawMediaUrl(item: unknown): string | null {
  if (typeof item === 'string') {
    const trimmed = item.trim();
    return trimmed || null;
  }
  if (!item || typeof item !== 'object') {
    return null;
  }
  const raw = item as RawMediaObject;
  const candidate = raw.url ?? raw.src ?? raw.value;
  if (typeof candidate !== 'string') {
    return null;
  }
  const trimmed = candidate.trim();
  return trimmed || null;
}

function readMediaSortOrder(item: unknown): number {
  if (!item || typeof item !== 'object') {
    return Number.MAX_SAFE_INTEGER;
  }
  const raw = item as RawMediaObject;
  return parseSortOrder(raw.position ?? raw.sortOrder);
}

/** True when a value can be shown as an admin list thumbnail. */
export function canRenderAdminProductListImage(src: string | null | undefined): boolean {
  return normalizeAdminListImageUrl(src) !== null;
}

/**
 * Normalize a candidate URL for admin list thumbnails.
 * Does not mutate stored DB values — returns a display URL or null.
 */
export function normalizeAdminListImageUrl(input: unknown): string | null {
  if (input == null) {
    return null;
  }

  let raw = '';
  if (typeof input === 'string') {
    raw = input.trim();
  } else if (typeof input === 'object') {
    raw = extractRawMediaUrl(input) ?? '';
  }

  if (!raw) {
    return null;
  }

  const lower = raw.toLowerCase();
  if (lower.startsWith('data:')) {
    return null;
  }
  if (lower.startsWith('blob:')) {
    return null;
  }
  if (lower.startsWith('file:')) {
    return null;
  }
  if (lower.startsWith('javascript:')) {
    return null;
  }
  if (RAW_BASE64_PATTERN.test(raw) && !raw.includes('/') && !raw.includes('.')) {
    return null;
  }

  if (raw.startsWith('https://') || raw.startsWith('http://')) {
    try {
      const parsed = new URL(raw);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null;
      }
      return parsed.href;
    } catch {
      return null;
    }
  }

  if (raw.startsWith('//')) {
    return null;
  }

  if (raw.startsWith('/')) {
    return raw;
  }

  return null;
}

function firstValidFromMedia(media: unknown): {
  primary: string | null;
  firstValid: string | null;
} {
  if (!Array.isArray(media) || media.length === 0) {
    return { primary: null, firstValid: null };
  }

  const ordered = media
    .map((item, index) => ({ item, index, sortOrder: readMediaSortOrder(item) }))
    .sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }
      return left.index - right.index;
    });

  let primary: string | null = null;
  let firstValid: string | null = null;

  for (let i = 0; i < ordered.length; i += 1) {
    const entry = ordered[i];
    if (!entry) {
      continue;
    }
    const normalized = normalizeAdminListImageUrl(extractRawMediaUrl(entry.item));
    if (!normalized) {
      continue;
    }
    if (i === 0) {
      primary = normalized;
    }
    if (!firstValid) {
      firstValid = normalized;
    }
    if (primary && firstValid) {
      break;
    }
  }

  return { primary, firstValid };
}

function variantPrice(variant: ListVariantImageSource): number {
  const n = typeof variant.price === 'number' ? variant.price : Number(variant.price);
  return Number.isFinite(n) ? n : 0;
}

function pickPrimaryPublishedVariant(
  variants: readonly ListVariantImageSource[],
): ListVariantImageSource | null {
  const published = variants.filter((variant) => variant.published !== false);
  const pool = published.length > 0 ? published : [...variants];
  if (pool.length === 0) {
    return null;
  }
  const positive = pool.filter((variant) => variantPrice(variant) > 0);
  const candidates = positive.length > 0 ? positive : pool;
  const sorted = [...candidates].sort((left, right) => variantPrice(left) - variantPrice(right));
  return sorted[0] ?? null;
}

function firstValidVariantImage(
  variants: readonly ListVariantImageSource[],
  skipUrl: string | null = null,
): string | null {
  for (const variant of variants) {
    if (variant.published === false) {
      continue;
    }
    if (!variant.imageUrl) {
      continue;
    }
    for (const part of variant.imageUrl.split(',')) {
      const normalized = normalizeAdminListImageUrl(part);
      if (!normalized) {
        continue;
      }
      if (skipUrl && normalized === skipUrl) {
        continue;
      }
      return normalized;
    }
  }
  return null;
}

/**
 * Resolve admin list thumbnail with deterministic priority:
 * 1. Primary product media
 * 2. First valid product media
 * 3. Primary/selected published-variant imageUrl
 * 4. Any valid published-variant imageUrl
 * 5. ProductListingRow.image
 * 6. null
 */
export function resolveAdminProductListImageUrl(
  media: unknown,
  variants: readonly ListVariantImageSource[] = [],
  listingRowImage: string | null = null,
): string | null {
  const { primary, firstValid } = firstValidFromMedia(media);
  if (primary) {
    return primary;
  }
  if (firstValid) {
    return firstValid;
  }

  const primaryVariant = pickPrimaryPublishedVariant(variants);
  const primaryVariantImage = normalizeAdminListImageUrl(primaryVariant?.imageUrl ?? null);
  if (primaryVariantImage) {
    return primaryVariantImage;
  }

  const anyVariantImage = firstValidVariantImage(variants);
  if (anyVariantImage) {
    return anyVariantImage;
  }

  return normalizeAdminListImageUrl(listingRowImage);
}

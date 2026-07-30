import { createHash } from 'node:crypto';

import { isLocalFilesystemImageReference } from '@/lib/utils/image-utils';
import { toSlug } from '@/lib/utils/slug';

const BRAND_LOGOS_R2_PREFIX = 'brands/logos/';
const FALLBACK_BASENAME_PREFIX = 'name-';

const IMPORT_SLUG_PREFIX = 'import-';

type ResolveBrandLogoBasenameInput = {
  slug?: string;
  name: string;
  brandId?: string;
};

function hashNameBasename(name: string): string {
  return createHash('sha256').update(name.trim()).digest('hex').slice(0, 24);
}

/**
 * Appends a content hash query param so browsers/CDN fetch a replaced logo at the same R2 key.
 */
export function appendBrandLogoCacheBuster(publicUrl: string, imageBuffer: Buffer): string {
  const version = createHash('sha256').update(imageBuffer).digest('hex').slice(0, 16);
  const baseUrl = publicUrl.split('?')[0]?.trim() ?? publicUrl.trim();
  return `${baseUrl}?v=${version}`;
}

/**
 * R2 object basename for a brand logo (no prefix/extension).
 * Prefers canonical slug; import slugs fall back to name slug, then brand id.
 */
export function resolveBrandLogoR2Basename(input: ResolveBrandLogoBasenameInput): string {
  const slug = input.slug?.trim().toLowerCase() ?? '';
  if (slug.length > 0 && !slug.startsWith(IMPORT_SLUG_PREFIX)) {
    return slug;
  }

  const fromName = toSlug(input.name);
  if (fromName.length > 0) {
    return fromName;
  }

  const brandId = input.brandId?.trim();
  if (brandId) {
    return brandId;
  }

  const trimmedName = input.name.trim();
  if (trimmedName.length > 0) {
    return `${FALLBACK_BASENAME_PREFIX}${hashNameBasename(trimmedName)}`;
  }

  throw {
    status: 400,
    type: 'https://api.shop.am/problems/validation-error',
    title: 'Validation Error',
    detail: 'Brand name or id is required to resolve logo storage key',
  };
}

export function buildBrandLogoR2Key(basename: string, extension: string): string {
  return `${BRAND_LOGOS_R2_PREFIX}${basename}.${extension}`;
}

/** Rejects base64 and local paths — persisted logos must be public HTTP(S) URLs (R2). */
export function assertPersistableBrandLogoUrl(logoUrl: string | null | undefined): void {
  if (logoUrl === undefined || logoUrl === null) {
    return;
  }

  const value = logoUrl.trim();
  if (value.length === 0) {
    return;
  }

  if (value.startsWith('data:')) {
    throw validationError('Brand logo must be uploaded to storage, not embedded as base64');
  }

  if (isLocalFilesystemImageReference(value)) {
    throw validationError('Brand logo URL must not reference a local filesystem path');
  }

  if (!value.startsWith('https://') && !value.startsWith('http://')) {
    throw validationError('Brand logo URL must be an absolute http(s) URL');
  }
}

function validationError(detail: string): {
  status: number;
  type: string;
  title: string;
  detail: string;
} {
  return {
    status: 400,
    type: 'https://api.shop.am/problems/validation-error',
    title: 'Validation Error',
    detail,
  };
}

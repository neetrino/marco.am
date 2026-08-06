/**
 * Rules for product image values that may be persisted (media / variant / listing).
 * Base64 and blob URLs are never valid final storage formats.
 */

const RAW_BASE64_PATTERN = /^[A-Za-z0-9+/=\s]{80,}$/;

export const PRODUCT_IMAGE_MUST_BE_R2_MESSAGE =
  'Product images must be uploaded to R2 before the product can be saved.';

export type PersistedProductImageRejectReason =
  | 'empty'
  | 'data_url'
  | 'blob_url'
  | 'raw_base64'
  | 'unsafe_scheme'
  | 'malformed'
  | 'unsupported';

/**
 * Classify why a candidate cannot be stored as a product image URL.
 */
export function classifyInvalidPersistedProductImage(
  input: unknown,
): PersistedProductImageRejectReason | null {
  if (input == null) {
    return 'empty';
  }

  let raw = '';
  if (typeof input === 'string') {
    raw = input.trim();
  } else if (typeof input === 'object') {
    const obj = input as { url?: string; src?: string; value?: string };
    const candidate = obj.url ?? obj.src ?? obj.value;
    raw = typeof candidate === 'string' ? candidate.trim() : '';
  }

  if (!raw) {
    return 'empty';
  }

  const lower = raw.toLowerCase();
  if (lower.startsWith('data:')) {
    return 'data_url';
  }
  if (lower.startsWith('blob:')) {
    return 'blob_url';
  }
  if (lower.startsWith('file:') || lower.startsWith('javascript:')) {
    return 'unsafe_scheme';
  }
  if (RAW_BASE64_PATTERN.test(raw) && !raw.includes('/') && !raw.includes('.')) {
    return 'raw_base64';
  }

  if (raw.startsWith('https://') || raw.startsWith('http://')) {
    try {
      const parsed = new URL(raw);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return 'unsafe_scheme';
      }
      return null;
    } catch {
      return 'malformed';
    }
  }

  if (raw.startsWith('/') && !raw.startsWith('//')) {
    return null;
  }

  return 'unsupported';
}

/**
 * Normalize a persisted product image URL or throw with a clear validation message.
 */
export function assertPersistedProductImageUrl(input: unknown): string {
  const reason = classifyInvalidPersistedProductImage(input);
  if (reason !== null) {
    throw Object.assign(new Error(PRODUCT_IMAGE_MUST_BE_R2_MESSAGE), {
      status: 400,
      type: 'https://api.shop.am/problems/validation-error',
      title: 'Validation Error',
      detail: PRODUCT_IMAGE_MUST_BE_R2_MESSAGE,
      reason,
    });
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return new URL(trimmed).href;
    }
    return trimmed;
  }

  const obj = input as { url?: string; src?: string; value?: string };
  const candidate = (obj.url ?? obj.src ?? obj.value ?? '').trim();
  if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
    return new URL(candidate).href;
  }
  return candidate;
}

/**
 * Soft check used by listing rebuild / diagnostics (null instead of throw).
 */
export function toPersistedProductImageUrl(input: unknown): string | null {
  try {
    return assertPersistedProductImageUrl(input);
  } catch {
    return null;
  }
}

export function extractRawImageCandidate(item: unknown): string | null {
  if (typeof item === 'string') {
    const trimmed = item.trim();
    return trimmed || null;
  }
  if (!item || typeof item !== 'object') {
    return null;
  }
  const obj = item as { url?: string; src?: string; value?: string };
  const candidate = obj.url ?? obj.src ?? obj.value;
  if (typeof candidate !== 'string') {
    return null;
  }
  const trimmed = candidate.trim();
  return trimmed || null;
}

/**
 * Validate and flatten a product media payload to HTTPS/site-relative URL strings.
 */
export function assertPersistedProductMediaPayload(media: unknown): string[] {
  if (media === undefined || media === null) {
    return [];
  }
  if (!Array.isArray(media)) {
    throw Object.assign(new Error(PRODUCT_IMAGE_MUST_BE_R2_MESSAGE), {
      status: 400,
      type: 'https://api.shop.am/problems/validation-error',
      title: 'Validation Error',
      detail: PRODUCT_IMAGE_MUST_BE_R2_MESSAGE,
    });
  }

  const out: string[] = [];
  for (const item of media) {
    const raw = extractRawImageCandidate(item);
    if (!raw) {
      continue;
    }
    out.push(assertPersistedProductImageUrl(raw));
  }
  return out;
}

/**
 * Validate comma-separated variant imageUrl slots.
 */
export function assertPersistedCommaSeparatedImageUrls(input: string): string {
  const parts = input
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const validated = parts.map((part) => assertPersistedProductImageUrl(part));
  return validated.join(',');
}

export function isDataOrBlobImageReference(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  const trimmed = value.trim().toLowerCase();
  return (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    (RAW_BASE64_PATTERN.test(value.trim()) && !value.includes('/') && !value.includes('.'))
  );
}

export function redactImageRefForLog(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.toLowerCase().startsWith('data:')) {
    const mimeMatch = trimmed.match(/^data:([^;]+);/i);
    return `data:${mimeMatch?.[1] ?? 'image'}…;base64,[redacted]`;
  }
  if (trimmed.length > 120) {
    return `${trimmed.slice(0, 120)}…`;
  }
  return trimmed;
}

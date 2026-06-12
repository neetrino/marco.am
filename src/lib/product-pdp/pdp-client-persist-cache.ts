import type { Product } from "@/app/products/[slug]/types";
import type { LanguageCode } from "@/lib/language";
import type { RelatedProductsApiResponse } from "@/lib/product-pdp/fetch-related-products";

const PDP_DETAIL_TTL_MS = 5 * 60 * 1000;
const PDP_RELATED_TTL_MS = 5 * 60 * 1000;

type PersistedEnvelope<T> = {
  createdAt: number;
  value: T;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function readPersistedValue<T>(key: string, ttlMs: number): T | null {
  if (!canUseStorage()) {
    return null;
  }
  const raw = window.sessionStorage.getItem(key);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as PersistedEnvelope<T>;
    if (!parsed || typeof parsed !== "object" || typeof parsed.createdAt !== "number") {
      window.sessionStorage.removeItem(key);
      return null;
    }
    if (Date.now() - parsed.createdAt > ttlMs) {
      window.sessionStorage.removeItem(key);
      return null;
    }
    return parsed.value ?? null;
  } catch {
    window.sessionStorage.removeItem(key);
    return null;
  }
}

function writePersistedValue<T>(key: string, value: T): void {
  if (!canUseStorage()) {
    return;
  }
  try {
    const payload: PersistedEnvelope<T> = {
      createdAt: Date.now(),
      value,
    };
    window.sessionStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Ignore storage quota / serialization errors for non-critical cache.
  }
}

function detailKey(slug: string, lang: LanguageCode): string {
  return `pdp:detail:${lang}:${slug}`;
}

function relatedKey(slug: string, lang: LanguageCode, limit: number): string {
  return `pdp:related:${lang}:${slug}:${limit}`;
}

export function getPersistedPdpDetail(slug: string, lang: LanguageCode): Product | null {
  return readPersistedValue<Product>(detailKey(slug, lang), PDP_DETAIL_TTL_MS);
}

export function setPersistedPdpDetail(slug: string, lang: LanguageCode, value: Product): void {
  writePersistedValue(detailKey(slug, lang), value);
}

export function getPersistedPdpRelated(
  slug: string,
  lang: LanguageCode,
  limit: number,
): RelatedProductsApiResponse | null {
  return readPersistedValue<RelatedProductsApiResponse>(
    relatedKey(slug, lang, limit),
    PDP_RELATED_TTL_MS,
  );
}

export function setPersistedPdpRelated(
  slug: string,
  lang: LanguageCode,
  limit: number,
  value: RelatedProductsApiResponse,
): void {
  writePersistedValue(relatedKey(slug, lang, limit), value);
}

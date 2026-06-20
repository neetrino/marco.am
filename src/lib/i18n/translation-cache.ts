export const SKIP_I18N_RESULT_CACHE = process.env.NODE_ENV === 'development';

const TRANSLATION_RESULT_CACHE_MAX = 1000;
const ATTRIBUTE_LABEL_CACHE_MAX = 500;

const translationCache = new Map<string, string>();
const attributeLabelCache = new Map<string, string>();

export function getCachedTranslation(key: string): string | undefined {
  return translationCache.get(key);
}

export function setCachedTranslation(key: string, value: string): void {
  if (SKIP_I18N_RESULT_CACHE || translationCache.size >= TRANSLATION_RESULT_CACHE_MAX) {
    return;
  }
  translationCache.set(key, value);
}

export function getCachedAttributeLabel(key: string): string | undefined {
  return attributeLabelCache.get(key);
}

export function setCachedAttributeLabel(key: string, value: string): void {
  if (SKIP_I18N_RESULT_CACHE || attributeLabelCache.size >= ATTRIBUTE_LABEL_CACHE_MAX) {
    return;
  }
  attributeLabelCache.set(key, value);
}

export function clearTranslationCache(): void {
  translationCache.clear();
  attributeLabelCache.clear();
}

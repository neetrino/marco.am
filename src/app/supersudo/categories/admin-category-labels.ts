/** Resolve admin.categories strings with fallback when dev bundle lags locale JSON. */
export function translateAdminCategoryLabel(
  t: (path: string) => string,
  key: string,
  fallback: string,
): string {
  const value = t(key);
  return value.startsWith('[missing:') ? fallback : value;
}

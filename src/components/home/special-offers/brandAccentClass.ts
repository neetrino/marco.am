/**
 * Figma NEWS / product strip — brand wordmark colors (uppercase titles).
 */
const BRAND_ACCENT_BY_NORMALIZED: Readonly<Record<string, string>> = {
  samsung: 'text-[#354ae6] dark:text-[#383838]',
  apple: 'text-[#0f0f0f] dark:text-[#383838]',
  bosch: 'text-[#af1b1b] dark:text-[#383838]',
  lg: 'text-[#d51212] dark:text-[#383838]',
};

/**
 * Tailwind text color class for known brand names; default dark neutral.
 */
export function brandAccentClass(brandName: string | null | undefined): string {
  if (!brandName?.trim()) {
    return 'text-[#0f0f0f] dark:text-[#383838]';
  }
  const key = brandName.trim().toLowerCase();
  return BRAND_ACCENT_BY_NORMALIZED[key] ?? 'text-[#0f0f0f] dark:text-[#383838]';
}

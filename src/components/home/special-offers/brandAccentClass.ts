/**
 * Figma NEWS / product strip — brand wordmark colors (uppercase titles).
 */
const BRAND_ACCENT_BY_NORMALIZED: Readonly<Record<string, string>> = {
  samsung: 'text-[#354ae6] dark:text-[#050505]',
  apple: 'text-[#0f0f0f] dark:text-[#050505]',
  bosch: 'text-[#af1b1b] dark:text-[#050505]',
  lg: 'text-[#d51212] dark:text-[#050505]',
};

/**
 * Tailwind text color class for known brand names; default dark neutral.
 */
export function brandAccentClass(brandName: string | null | undefined): string {
  if (!brandName?.trim()) {
    return 'text-[#0f0f0f] dark:text-[#050505]';
  }
  const key = brandName.trim().toLowerCase();
  return BRAND_ACCENT_BY_NORMALIZED[key] ?? 'text-[#0f0f0f] dark:text-[#050505]';
}

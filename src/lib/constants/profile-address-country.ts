/**
 * ISO 3166-1 alpha-2 codes offered in profile shipping address form.
 * Labels use `profile.addresses.country*` i18n keys.
 */
export const PROFILE_ADDRESS_COUNTRY_CODES = ["AM", "US", "RU", "GE"] as const;

export type ProfileAddressCountryCode = (typeof PROFILE_ADDRESS_COUNTRY_CODES)[number];

/** Maps country code to `profile.json` translation key under `addresses`. */
export const PROFILE_ADDRESS_COUNTRY_LABEL_KEYS: Record<
  ProfileAddressCountryCode,
  string
> = {
  AM: "profile.addresses.countryArmenia",
  US: "profile.addresses.countryUS",
  RU: "profile.addresses.countryRU",
  GE: "profile.addresses.countryGE",
};

/**
 * Resolved label for list UI; falls back to raw code if not in the known set.
 */
export function getProfileAddressCountryLabel(
  countryCode: string | undefined,
  t: (key: string) => string
): string {
  if (!countryCode) {
    return "";
  }
  const upper = countryCode.toUpperCase() as ProfileAddressCountryCode;
  const key = PROFILE_ADDRESS_COUNTRY_LABEL_KEYS[upper];
  return key ? t(key) : countryCode;
}

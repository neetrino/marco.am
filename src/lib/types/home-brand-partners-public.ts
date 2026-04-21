/** Public home brand partners rail — matches `GET /api/v1/home/brand-partners`. */
export type HomeBrandPartnerLogoScale = "default" | "large";

export type HomeBrandPartnerPublicItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  /** Absolute or site-relative logo asset URL; null if unset in admin. */
  logoUrl: string | null;
  /** Destination route for partner card (usually PLP deep link with brand filter). */
  href: string;
  logoScale?: HomeBrandPartnerLogoScale;
};

export type HomeBrandPartnersPublicPayload = {
  sectionTitle: string;
  brands: HomeBrandPartnerPublicItem[];
};

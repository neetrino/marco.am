/**
 * Brand payload included on product listing / card APIs (shop, home, related).
 */
export type ProductListingBrand = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
};

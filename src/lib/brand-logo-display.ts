/** UI tweaks for brand logo marks on product cards (remote R2 URLs only). */

export const GEEPAS_BRAND_LOGO_UI_SCALE = 1.42;

export function resolveProductCardBrandLogoUiScale(slug: string, name: string): number {
  const slugKey = slug.trim().toLowerCase();
  const nameKey = name.trim().toLowerCase();

  if (slugKey === 'geepas' || nameKey === 'geepas' || slugKey.includes('geepas')) {
    return GEEPAS_BRAND_LOGO_UI_SCALE;
  }

  return 1;
}

export function isGeepasBrandLogo(slug: string, name: string): boolean {
  return resolveProductCardBrandLogoUiScale(slug, name) !== 1;
}

import { db } from "@white-shop/db";

/**
 * Get active banners for homepage, ordered by position.
 */
export async function getActiveBanners() {
  return db.banner.findMany({
    where: { active: true },
    orderBy: { position: "asc" },
  });
}

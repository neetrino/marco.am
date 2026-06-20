import { adminStatsService } from "@/lib/services/admin/admin-stats.service";
import { getProductDiscountsList } from "@/lib/services/admin/admin-products-read/product-discounts-list";
import { adminBrandsService } from "@/lib/services/admin/admin-brands.service";
import { adminCategoriesService } from "@/lib/services/admin/admin-categories.service";
import { adminSettingsService } from "@/lib/services/admin/admin-settings.service";
import { logger } from "@/lib/utils/logger";

export const ADMIN_BOOTSTRAP_PATHS = ["dashboard", "quick-settings"] as const;

export type AdminBootstrapPath = (typeof ADMIN_BOOTSTRAP_PATHS)[number];

export type AdminDashboardBootstrapPayload = {
  stats: Awaited<ReturnType<typeof adminStatsService.getStats>> | null;
  recentOrders: { data: Awaited<ReturnType<typeof adminStatsService.getRecentOrders>> };
  topProducts: { data: Awaited<ReturnType<typeof adminStatsService.getTopProducts>> };
  userActivity: { data: Awaited<ReturnType<typeof adminStatsService.getUserActivity>> | null };
};

export type AdminQuickSettingsBootstrapPayload = {
  settings: Awaited<ReturnType<typeof adminSettingsService.getSettings>>;
  categories: Awaited<ReturnType<typeof adminCategoriesService.getCategories>>;
  brands: Awaited<ReturnType<typeof adminBrandsService.getBrands>>;
  productDiscounts: Awaited<ReturnType<typeof getProductDiscountsList>>;
};

export type AdminBootstrapResponse = {
  dashboard?: AdminDashboardBootstrapPayload;
  "quick-settings"?: AdminQuickSettingsBootstrapPayload;
};

function normalizeLocale(localeInput?: string): string {
  const locale = localeInput?.trim().toLowerCase();
  return locale === "hy" || locale === "ru" || locale === "en" ? locale : "en";
}

/** Parses comma-separated bootstrap path query (unknown segments ignored). */
export function parseAdminBootstrapPaths(raw: string | null): AdminBootstrapPath[] {
  if (!raw?.trim()) {
    return [];
  }

  const allowed = new Set<string>(ADMIN_BOOTSTRAP_PATHS);
  const seen = new Set<AdminBootstrapPath>();
  const paths: AdminBootstrapPath[] = [];

  for (const segment of raw.split(",")) {
    const path = segment.trim();
    if (!allowed.has(path) || seen.has(path as AdminBootstrapPath)) {
      continue;
    }
    seen.add(path as AdminBootstrapPath);
    paths.push(path as AdminBootstrapPath);
  }

  return paths;
}

function settledValue<T>(result: PromiseSettledResult<T>, fallback: T, label: string): T {
  if (result.status === "fulfilled") {
    return result.value;
  }
  logger.error("Admin dashboard bootstrap section failed", { section: label, reason: result.reason });
  return fallback;
}

async function buildDashboardBootstrap(): Promise<AdminDashboardBootstrapPayload> {
  const [stats, recentOrders, topProducts, userActivity] = await Promise.allSettled([
    adminStatsService.getStats(),
    adminStatsService.getRecentOrders(5),
    adminStatsService.getTopProducts(5),
    adminStatsService.getUserActivity(10),
  ]);

  return {
    stats: settledValue(stats, null, "stats"),
    recentOrders: { data: settledValue(recentOrders, [], "recentOrders") },
    topProducts: { data: settledValue(topProducts, [], "topProducts") },
    userActivity: { data: settledValue(userActivity, null, "userActivity") },
  };
}

async function buildQuickSettingsBootstrap(locale: string): Promise<AdminQuickSettingsBootstrapPayload> {
  const normalizedLocale = normalizeLocale(locale);
  const [settings, categories, brands, productDiscounts] = await Promise.all([
    adminSettingsService.getSettings(),
    adminCategoriesService.getCategories(normalizedLocale, { includeCounts: false }),
    adminBrandsService.getBrands(),
    getProductDiscountsList(normalizedLocale),
  ]);

  return {
    settings,
    categories,
    brands,
    productDiscounts,
  };
}

/** Builds one or more admin page payloads in a single server round-trip. */
export async function buildAdminBootstrap(
  paths: AdminBootstrapPath[],
  locale?: string,
): Promise<AdminBootstrapResponse> {
  const response: AdminBootstrapResponse = {};
  const tasks: Promise<void>[] = [];

  if (paths.includes("dashboard")) {
    tasks.push(
      buildDashboardBootstrap().then((payload) => {
        response.dashboard = payload;
      }),
    );
  }

  if (paths.includes("quick-settings")) {
    tasks.push(
      buildQuickSettingsBootstrap(locale ?? "en").then((payload) => {
        response["quick-settings"] = payload;
      }),
    );
  }

  await Promise.all(tasks);
  return response;
}

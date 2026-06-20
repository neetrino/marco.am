import { cacheService } from "@/lib/services/cache.service";
import { getCachedJson } from "@/lib/services/read-through-json-cache";

import { getAnalytics } from "./analytics";
import { getOrderStatusBreakdown } from "./order-status-breakdown";

const ADMIN_ANALYTICS_CACHE_PREFIX = "admin:analytics:v1:";
const ADMIN_ORDER_STATUS_BREAKDOWN_CACHE_KEY = "admin:analytics:order-status-breakdown:v1";
const ADMIN_ANALYTICS_CACHE_TTL_SEC = 300;

function buildAnalyticsCacheKey(
  period: string,
  startDate?: string,
  endDate?: string,
): string {
  if (period === "custom") {
    return `${ADMIN_ANALYTICS_CACHE_PREFIX}custom:${startDate ?? ""}:${endDate ?? ""}`;
  }
  return `${ADMIN_ANALYTICS_CACHE_PREFIX}${period}`;
}

/** Read-through Redis cache for admin analytics period reports. */
export async function getCachedAdminAnalytics(
  period: string = "week",
  startDate?: string,
  endDate?: string,
): Promise<Awaited<ReturnType<typeof getAnalytics>>> {
  const cacheKey = buildAnalyticsCacheKey(period, startDate, endDate);
  return getCachedJson(cacheKey, ADMIN_ANALYTICS_CACHE_TTL_SEC, () =>
    getAnalytics(period, startDate, endDate),
  );
}

/** Read-through Redis cache for analytics order-status breakdown widget. */
export async function getCachedAdminOrderStatusBreakdown(): Promise<
  Awaited<ReturnType<typeof getOrderStatusBreakdown>>
> {
  return getCachedJson(
    ADMIN_ORDER_STATUS_BREAKDOWN_CACHE_KEY,
    ADMIN_ANALYTICS_CACHE_TTL_SEC,
    () => getOrderStatusBreakdown(),
  );
}

/** Clears server analytics caches after order mutations. */
export async function invalidateAdminAnalyticsCache(): Promise<void> {
  await cacheService.deletePattern(`${ADMIN_ANALYTICS_CACHE_PREFIX}*`);
  await cacheService.del(ADMIN_ORDER_STATUS_BREAKDOWN_CACHE_KEY);
}

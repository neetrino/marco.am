import { buildAdminOrderDetailCacheKey } from '@/lib/admin/admin-cache-keys';
import {
  ADMIN_SESSION_CACHE_TTL_MS,
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/lib/admin/admin-session-cache';
import { hasLoadedOrderDetails } from './order-list-display';
import type { OrderDetails } from '../useOrders';

export function readAdminOrderDetailCache(orderId: string): OrderDetails | null {
  const cached = readAdminSessionCache<OrderDetails>(
    buildAdminOrderDetailCacheKey(orderId),
    ADMIN_SESSION_CACHE_TTL_MS,
  );
  return cached && hasLoadedOrderDetails(cached) ? cached : null;
}

export function persistAdminOrderDetailCache(orderId: string, details: OrderDetails): void {
  writeAdminSessionCache(buildAdminOrderDetailCacheKey(orderId), details);
}

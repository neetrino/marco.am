import { getStoredLanguage } from '@/lib/language';
import {
  mergeGuestWishlistAfterAuth,
  migrateLegacyWishlistFromLocalStorage,
} from '@/lib/wishlist/wishlist-client';
import {
  mergeGuestCompareAfterAuth,
  migrateLegacyCompareFromLocalStorage,
} from '@/lib/compare/compare-client';
import { logger } from '@/lib/utils/logger';

/**
 * Runs after successful authentication: migrates legacy storage and merges guest cookie rows.
 */
export async function syncGuestDataAfterAuth(): Promise<void> {
  const lang = getStoredLanguage();
  await migrateLegacyWishlistFromLocalStorage(lang);
  await mergeGuestWishlistAfterAuth();
  await migrateLegacyCompareFromLocalStorage(lang);
  await mergeGuestCompareAfterAuth();
}

/**
 * Starts guest wishlist/compare migration + merge without blocking the UI.
 * Call right after persisting the session so redirects feel instant.
 */
export function scheduleGuestDataSyncAfterAuth(): void {
  void syncGuestDataAfterAuth().catch((error: unknown) => {
    logger.error('Guest data sync after auth failed', { error });
  });
}

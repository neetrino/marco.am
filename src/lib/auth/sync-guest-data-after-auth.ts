import { getStoredLanguage } from '@/lib/language';
import {
  mergeGuestWishlistAfterAuth,
  migrateLegacyWishlistFromLocalStorage,
} from '@/lib/wishlist/wishlist-client';
import {
  mergeGuestCompareAfterAuth,
  migrateLegacyCompareFromLocalStorage,
} from '@/lib/compare/compare-client';

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

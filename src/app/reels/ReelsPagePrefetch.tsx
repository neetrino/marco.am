import { getReelsPageDataCached } from '@/lib/reels-page-server-data';

/** Starts the reels feed read-through fetch as early as possible in the RSC tree. */
export async function ReelsPagePrefetch() {
  await getReelsPageDataCached();
  return null;
}

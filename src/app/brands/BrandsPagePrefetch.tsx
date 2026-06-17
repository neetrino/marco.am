import { getBrandsPageDataCached } from '@/lib/brands-page-server-data';

/** Starts the brands directory read-through fetch as early as possible in the RSC tree. */
export async function BrandsPagePrefetch() {
  await getBrandsPageDataCached();
  return null;
}

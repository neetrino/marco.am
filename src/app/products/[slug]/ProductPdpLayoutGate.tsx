import { notFound } from 'next/navigation';

import { getCachedPdpExists } from '@/lib/product-pdp/pdp-server-cache';

type ProductPdpLayoutGateProps = {
  readonly baseSlug: string;
};

/** Non-blocking existence check — enables early 404 without blocking gallery paint. */
export async function ProductPdpLayoutGate({ baseSlug }: ProductPdpLayoutGateProps) {
  const exists = await getCachedPdpExists(baseSlug);
  if (!exists) {
    notFound();
  }

  return null;
}

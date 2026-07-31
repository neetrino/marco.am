import { notFound } from "next/navigation";

import { isValidProductSlug, normalizePdpSlug } from "@/lib/product-pdp/pdp-slug";

type Props = {
  params: Promise<{ slug: string }>;
};

/** Page slot reserved for streaming; PDP UI + SSR seeds live in `layout.tsx`. */
export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  if (!isValidProductSlug(normalizePdpSlug(slug))) {
    notFound();
  }
  return null;
}

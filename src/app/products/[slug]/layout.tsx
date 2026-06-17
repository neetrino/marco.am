import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { formatProductDescriptionForSeo } from "@/lib/products/product-description";
import { t } from "@/lib/i18n";
import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
  type LanguageCode,
} from "@/lib/language";
import { getCachedPdpDetail } from "@/lib/product-pdp/pdp-server-cache";
import { normalizePdpSlug } from "@/lib/product-pdp/pdp-slug";

import { ProductPdpLayoutGate } from "./ProductPdpLayoutGate";
import { ProductSlugLayoutClient } from "./ProductSlugLayoutClient";

const DEFAULT_TITLE = "Product";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang: LanguageCode =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? "en";
  const { slug } = await params;
  const siteName = t(lang, "common.meta.siteName");
  const browserTabTitle = t(lang, "common.meta.productTabTitle");

  try {
    const product = await getCachedPdpDetail(normalizePdpSlug(slug), lang);
    const title = product.seo?.title || product.title || DEFAULT_TITLE;
    const description =
      product.seo?.description || formatProductDescriptionForSeo(product.description ?? []) || null;
    const firstImage =
      Array.isArray(product.media) && product.media.length > 0
        ? String(product.media[0])
        : null;

    return {
      title: browserTabTitle,
      description: description ?? undefined,
      openGraph: {
        title: `${title} | ${siteName}`,
        description: description ?? undefined,
        ...(firstImage && { images: [{ url: firstImage, alt: title }] }),
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: description ?? undefined,
        ...(firstImage && { images: [firstImage] }),
      },
    };
  } catch {
    return {
      title: browserTabTitle,
    };
  }
}

export default async function ProductSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug: slugParam } = await params;
  const cookieStore = await cookies();
  const serverLanguage: LanguageCode =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? "en";
  const baseSlug = normalizePdpSlug(slugParam);

  return (
    <>
      <Suspense fallback={null}>
        <ProductPdpLayoutGate baseSlug={baseSlug} serverLanguage={serverLanguage} />
      </Suspense>
      <ProductSlugLayoutClient slugParam={slugParam} serverLanguage={serverLanguage} />
      {children}
    </>
  );
}

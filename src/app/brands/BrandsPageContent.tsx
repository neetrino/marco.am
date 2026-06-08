'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';

import { StaticPageLoadingSkeleton } from '@/components/navigation/StaticPageLoadingSkeleton';
import {
  BRANDS_DIRECTORY_CARD_MIN_HEIGHT_PX,
  BRANDS_DIRECTORY_LCP_IMAGE_PRIORITY_COUNT,
  BRANDS_DIRECTORY_LOGO_CELL_HEIGHT_PX,
  BRANDS_DIRECTORY_LOGO_CELL_MAX_WIDTH_PX,
  BRANDS_DIRECTORY_LOGO_IMAGE_CLASS,
} from '@/constants/brands-directory-layout';
import {
  BRANDS_DIRECTORY_CARD_OVERSIZED_MIN_HEIGHT_PX,
  BRANDS_DIRECTORY_LOGO_OVERSIZED_CELL_HEIGHT_PX,
  BRANDS_DIRECTORY_LOGO_OVERSIZED_CELL_MAX_WIDTH_PX,
  isBrandLogoCellOversizedSlug,
} from '@/lib/brand-logo-cell-oversize';
import { resolveBrandDisplayLogoForCell } from '@/lib/brand-static-logo-assets';
import {
  fetchHomeBrandPartnersClient,
  HOME_BRAND_PARTNERS_QUERY_STALE_MS,
} from '@/lib/home-brand-partners-client';
import { useTranslation } from '@/lib/i18n-client';
import type { LanguageCode } from '@/lib/language';
import { queryKeys } from '@/lib/query-keys';
import type {
  HomeBrandPartnerPublicItem,
  HomeBrandPartnersPublicPayload,
} from '@/lib/types/home-brand-partners-public';

type BrandsPageContentProps = {
  readonly initialPayload?: HomeBrandPartnersPublicPayload;
  readonly serverLanguage?: LanguageCode;
};

function brandDirectoryLogoCellStyle(slug: string, displayName: string): CSSProperties {
  const oversized = isBrandLogoCellOversizedSlug(slug, displayName);
  return {
    height: `${oversized ? BRANDS_DIRECTORY_LOGO_OVERSIZED_CELL_HEIGHT_PX : BRANDS_DIRECTORY_LOGO_CELL_HEIGHT_PX}px`,
    maxWidth: `${oversized ? BRANDS_DIRECTORY_LOGO_OVERSIZED_CELL_MAX_WIDTH_PX : BRANDS_DIRECTORY_LOGO_CELL_MAX_WIDTH_PX}px`,
    width: '100%',
  };
}

function BrandDirectoryLogo({
  partner,
  imagePriority,
}: {
  partner: HomeBrandPartnerPublicItem;
  imagePriority: boolean;
}) {
  const resolved = resolveBrandDisplayLogoForCell(
    partner.logoUrl,
    partner.slug,
    partner.name,
  );

  const cell = brandDirectoryLogoCellStyle(partner.slug, partner.name);
  const sizesWidth = isBrandLogoCellOversizedSlug(partner.slug, partner.name)
    ? BRANDS_DIRECTORY_LOGO_OVERSIZED_CELL_MAX_WIDTH_PX
    : BRANDS_DIRECTORY_LOGO_CELL_MAX_WIDTH_PX;

  if (resolved.mode === 'wordmark') {
    return (
      <div
        className="mx-auto flex w-full shrink-0 items-center justify-center overflow-hidden px-1"
        style={cell}
      >
        <span className="line-clamp-2 max-h-full max-w-full text-center text-base font-semibold uppercase leading-tight tracking-[0.14em] text-[#383838] dark:text-[#383838] md:text-lg">
          {partner.name.trim() || partner.slug}
        </span>
      </div>
    );
  }

  if (resolved.mode === 'local') {
    return (
      <div
        className="relative mx-auto w-full shrink-0 overflow-hidden"
        style={cell}
      >
        <Image
          src={resolved.asset.src}
          alt={partner.name}
          fill
          className={BRANDS_DIRECTORY_LOGO_IMAGE_CLASS}
          sizes={`${sizesWidth}px`}
          priority={imagePriority}
          loading={imagePriority ? undefined : 'lazy'}
        />
      </div>
    );
  }

  return (
    <div
      className="relative mx-auto flex w-full shrink-0 items-center justify-center overflow-hidden"
      style={cell}
    >
      <img
        src={resolved.src}
        alt={partner.name}
        className={BRANDS_DIRECTORY_LOGO_IMAGE_CLASS}
        loading={imagePriority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={imagePriority ? 'high' : 'auto'}
      />
    </div>
  );
}

function BrandsDirectoryGrid({ brands }: { brands: readonly HomeBrandPartnerPublicItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {brands.map((partner, index) => (
        <Link
          key={partner.id}
          href={partner.href}
          style={{
            minHeight: `${
              isBrandLogoCellOversizedSlug(partner.slug, partner.name)
                ? BRANDS_DIRECTORY_CARD_OVERSIZED_MIN_HEIGHT_PX
                : BRANDS_DIRECTORY_CARD_MIN_HEIGHT_PX
            }px`,
          }}
          className="group flex items-center justify-center rounded-2xl border border-marco-border bg-[#ffffff] px-4 py-5 sm:px-5 sm:py-6 transition-colors hover:border-marco-black/30 hover:bg-[#f8f8f8] dark:bg-[#ffffff] dark:hover:bg-[#f8f8f8]"
          aria-label={partner.name}
        >
          <BrandDirectoryLogo
            partner={partner}
            imagePriority={index < BRANDS_DIRECTORY_LCP_IMAGE_PRIORITY_COUNT}
          />
        </Link>
      ))}
    </div>
  );
}

function resolveInitialBrandPartnersPayload(
  lang: LanguageCode,
  serverLanguage: LanguageCode | undefined,
  initialPayload: HomeBrandPartnersPublicPayload | undefined,
  cachedPayload: HomeBrandPartnersPublicPayload | undefined,
): HomeBrandPartnersPublicPayload | undefined {
  if (initialPayload && serverLanguage === lang) {
    return initialPayload;
  }
  return cachedPayload;
}

/** Brand grid — SSR + React Query cache; idle/hover prefetch avoids loading flash on navigation. */
export function BrandsPageContent({
  initialPayload,
  serverLanguage,
}: BrandsPageContentProps) {
  const { t, lang } = useTranslation();
  const queryClient = useQueryClient();
  const cachedPayload = queryClient.getQueryData<HomeBrandPartnersPublicPayload>(
    queryKeys.homeBrandPartners(lang),
  );
  const initialData = resolveInitialBrandPartnersPayload(
    lang,
    serverLanguage,
    initialPayload,
    cachedPayload,
  );

  const brandPartnersQuery = useQuery({
    queryKey: queryKeys.homeBrandPartners(lang),
    queryFn: () => fetchHomeBrandPartnersClient(lang),
    staleTime: HOME_BRAND_PARTNERS_QUERY_STALE_MS,
    initialData,
    placeholderData: (previous) => previous,
    refetchOnMount: initialData === undefined,
    refetchOnWindowFocus: false,
  });

  const brands = brandPartnersQuery.data?.brands;

  if (brands === undefined && brandPartnersQuery.isPending) {
    return <StaticPageLoadingSkeleton variant="grid-body" />;
  }

  if (!brands || brands.length === 0) {
    return (
      <p className="text-center text-slate-600 dark:text-slate-400">
        {t('common.brandsPage.empty')}
      </p>
    );
  }

  return <BrandsDirectoryGrid brands={brands} />;
}

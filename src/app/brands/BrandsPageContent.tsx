'use client';

import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';

import { BrandPlpLink } from '@/components/BrandPlpLink';

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
import { shouldBypassNextImageOptimizer } from '@/lib/utils/should-bypass-next-image-optimizer';
import {
  fetchHomeBrandPartnersClient,
  HOME_BRAND_PARTNERS_QUERY_STALE_MS,
} from '@/lib/home-brand-partners-client';
import { useTranslation } from '@/lib/i18n-client';
import { queryKeys } from '@/lib/query-keys';
import type {
  HomeBrandPartnerPublicItem,
} from '@/lib/types/home-brand-partners-public';

function BrandsPageShell({ children }: { readonly children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="w-full pb-16 pt-10">
      <div className="marco-header-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#383838] dark:text-white md:text-4xl">
            {t('common.navigation.brands')}
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}

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
  r2FallbackUrl,
}: {
  partner: HomeBrandPartnerPublicItem;
  imagePriority: boolean;
  r2FallbackUrl?: string;
}) {
  const resolved = resolveBrandDisplayLogoForCell(
    partner.logoUrl,
    partner.slug,
    partner.name,
  );
  const [failedSrcSet, setFailedSrcSet] = useState<Set<string>>(new Set());

  const cell = brandDirectoryLogoCellStyle(partner.slug, partner.name);
  const candidateRemoteSrc = useMemo(() => {
    const out: string[] = [];
    if (resolved.mode === 'remote') {
      out.push(resolved.src);
    }
    if (r2FallbackUrl) {
      out.push(r2FallbackUrl);
    }
    return out.filter((src, index, arr) => arr.indexOf(src) === index && !failedSrcSet.has(src));
  }, [resolved, r2FallbackUrl, failedSrcSet]);

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
        className="relative mx-auto flex w-full shrink-0 items-center justify-center overflow-hidden"
        style={cell}
      >
        <Image
          src={resolved.asset.src}
          alt={partner.name}
          fill
          className={BRANDS_DIRECTORY_LOGO_IMAGE_CLASS}
          sizes={`${isBrandLogoCellOversizedSlug(partner.slug, partner.name) ? BRANDS_DIRECTORY_LOGO_OVERSIZED_CELL_MAX_WIDTH_PX : BRANDS_DIRECTORY_LOGO_CELL_MAX_WIDTH_PX}px`}
          loading={imagePriority ? 'eager' : 'lazy'}
          priority={imagePriority}
          fetchPriority={imagePriority ? 'high' : 'auto'}
          unoptimized={shouldBypassNextImageOptimizer(resolved.asset.src)}
        />
      </div>
    );
  }

  if (candidateRemoteSrc.length > 0) {
    return (
      <div
        className="relative mx-auto flex w-full shrink-0 items-center justify-center overflow-hidden"
        style={cell}
      >
        <Image
          src={candidateRemoteSrc[0]}
          alt={partner.name}
          fill
          className={BRANDS_DIRECTORY_LOGO_IMAGE_CLASS}
          sizes={`${isBrandLogoCellOversizedSlug(partner.slug, partner.name) ? BRANDS_DIRECTORY_LOGO_OVERSIZED_CELL_MAX_WIDTH_PX : BRANDS_DIRECTORY_LOGO_CELL_MAX_WIDTH_PX}px`}
          loading={imagePriority ? 'eager' : 'lazy'}
          priority={imagePriority}
          fetchPriority={imagePriority ? 'high' : 'auto'}
          unoptimized={shouldBypassNextImageOptimizer(candidateRemoteSrc[0])}
          onError={() => {
            const failed = candidateRemoteSrc[0];
            setFailedSrcSet((prev) => {
              const next = new Set(prev);
              next.add(failed);
              return next;
            });
          }}
        />
      </div>
    );
  }

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

function BrandsDirectoryGrid({ brands }: { brands: readonly HomeBrandPartnerPublicItem[] }) {
  const r2LogosQuery = useQuery({
    queryKey: ['home-brand-r2-logos'],
    queryFn: async () => {
      const response = await fetch('/api/v1/home/brand-r2-logos', { cache: 'no-store' });
      if (!response.ok) {
        return [] as string[];
      }
      const payload = (await response.json()) as { data?: string[] };
      return Array.isArray(payload.data) ? payload.data : [];
    },
    staleTime: HOME_BRAND_PARTNERS_QUERY_STALE_MS,
  });
  const r2ByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const url of r2LogosQuery.data ?? []) {
      const lower = url.toLowerCase();
      for (const partner of brands) {
        const nameToken = partner.name.toLowerCase().replace(/[^a-z0-9]+/g, '');
        const slugToken = partner.slug.toLowerCase().replace(/[^a-z0-9]+/g, '');
        if (
          (nameToken.length > 2 && lower.includes(nameToken)) ||
          (slugToken.length > 2 && lower.includes(slugToken))
        ) {
          if (!map.has(partner.id)) {
            map.set(partner.id, url);
          }
        }
      }
    }
    return map;
  }, [brands, r2LogosQuery.data]);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {brands.map((partner, index) => (
        <BrandPlpLink
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
            r2FallbackUrl={r2ByName.get(partner.id)}
          />
        </BrandPlpLink>
      ))}
    </div>
  );
}

/** Brand grid — client i18n + React Query cache for instant navigation. */
export function BrandsPageContent() {
  const { t, lang } = useTranslation();

  const brandPartnersQuery = useQuery({
    queryKey: queryKeys.homeBrandPartners(lang),
    queryFn: () => fetchHomeBrandPartnersClient(lang),
    staleTime: HOME_BRAND_PARTNERS_QUERY_STALE_MS,
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
  });

  const brands = brandPartnersQuery.data?.brands;

  if (brands === undefined && brandPartnersQuery.isPending) {
    return (
      <BrandsPageShell>
        <StaticPageLoadingSkeleton variant="grid-body" />
      </BrandsPageShell>
    );
  }

  if (!brands || brands.length === 0) {
    return (
      <BrandsPageShell>
        <p className="text-center text-slate-600 dark:text-slate-400">
          {t('common.brandsPage.empty')}
        </p>
      </BrandsPageShell>
    );
  }

  return (
    <BrandsPageShell>
      <BrandsDirectoryGrid brands={brands} />
    </BrandsPageShell>
  );
}

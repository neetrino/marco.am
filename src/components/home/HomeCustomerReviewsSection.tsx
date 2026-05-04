'use client';

import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';

import { HOME_LAZY_PUBLIC_SECTION_STALE_MS } from '@/constants/homeLazyPublicSections';
import type { HomeCustomerReviewsPublicPayload } from '@/lib/services/home-customer-reviews.service';
import { useTranslation } from '@/lib/i18n-client';
import { queryKeys } from '@/lib/query-keys';
import { logger } from '@/lib/utils/logger';

import { HOME_PAGE_SECTION_SHELL_CLASS } from './home-page-section-shell.constants';
import { useWhenNearViewport } from '../hooks/use-when-near-viewport';
import {
  ReviewCard,
  ReviewCarouselChrome,
} from './HomeCustomerReviewsSection.parts';
import { useReviewCarouselScroll } from './useReviewCarouselScroll';

export type HomeCustomerReviewsSectionProps = {
  initialReviews: HomeCustomerReviewsPublicPayload;
};

export function HomeCustomerReviewsSection({
  initialReviews,
}: HomeCustomerReviewsSectionProps) {
  const { lang } = useTranslation();
  const sectionRef = useRef<HTMLElement | null>(null);
  const nearViewport = useWhenNearViewport(sectionRef, { rootMargin: '200px 0px' });

  const reviewsQuery = useQuery({
    queryKey: queryKeys.homeCustomerReviews(lang),
    queryFn: async (): Promise<HomeCustomerReviewsPublicPayload> => {
      try {
        const res = await fetch(
          `/api/v1/home/customer-reviews?locale=${encodeURIComponent(lang)}`,
        );
        if (!res.ok) {
          throw new Error(`customer-reviews ${res.status}`);
        }
        return res.json() as Promise<HomeCustomerReviewsPublicPayload>;
      } catch (err) {
        logger.error('[HomeCustomerReviewsSection] fetch failed', { err, lang });
        throw err;
      }
    },
    enabled: nearViewport,
    staleTime: HOME_LAZY_PUBLIC_SECTION_STALE_MS,
    placeholderData: initialReviews,
    retry: 1,
  });

  const data = reviewsQuery.data ?? initialReviews;

  const { trackRef, canPrev, canNext, scrollByPage } = useReviewCarouselScroll(
    data.items.length,
  );

  if (data.items.length === 0) {
    return null;
  }

  const centerTrackOnDesktop = data.items.length <= 3;

  return (
    <section
      ref={sectionRef}
      className={`${HOME_PAGE_SECTION_SHELL_CLASS} py-10 sm:py-14`}
      aria-labelledby="home-customer-reviews-heading"
    >
      <h2
        id="home-customer-reviews-heading"
        className="mb-6 text-center font-semibold text-marco-black text-xl tracking-tight sm:mb-8 sm:text-2xl"
      >
        {data.sectionTitle}
      </h2>

      <div className="relative">
        <ReviewCarouselChrome
          canPrev={canPrev}
          canNext={canNext}
          onPrev={() => scrollByPage(-1)}
          onNext={() => scrollByPage(1)}
        />

        <div
          ref={trackRef}
          className={`flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            centerTrackOnDesktop ? 'md:justify-center' : ''
          }`}
        >
          {data.items.map((item) => (
            <ReviewCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

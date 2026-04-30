import { HOME_PAGE_SECTION_SHELL_CLASS } from '@/components/home/home-page-section-shell.constants';
import {
  SPECIAL_OFFERS_CARD_HEIGHT_PX,
  SPECIAL_OFFERS_CARD_SHELL_RADIUS_PX,
  SPECIAL_OFFERS_MOBILE_GRID_COLUMN_GAP_PX,
  SPECIAL_OFFERS_MOBILE_GRID_ROW_GAP_PX,
} from '@/components/home/home-special-offers.constants';

const cardSkeletonStyle = {
  height: SPECIAL_OFFERS_CARD_HEIGHT_PX,
  borderRadius: SPECIAL_OFFERS_CARD_SHELL_RADIUS_PX,
} as const;

/**
 * Shown inside Suspense while home listing server components resolve (Redis/DB).
 * Matches real card height so layout does not jump when content replaces this.
 */
export function HomeProductRailsSkeleton() {
  return (
    <section
      className="bg-white py-8 sm:py-10"
      aria-busy="true"
      aria-label="Loading products"
    >
      <div className={HOME_PAGE_SECTION_SHELL_CLASS}>
        <div className="mb-8 flex flex-row flex-wrap items-end justify-between gap-4">
          <div className="h-9 w-48 max-w-[60%] animate-pulse rounded bg-gray-200 md:h-10 md:w-56" />
          <div className="flex shrink-0 gap-2">
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-gray-200 md:h-10 md:w-10" />
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-gray-200 md:h-10 md:w-10" />
          </div>
        </div>
        <div className="hidden gap-x-6 md:grid md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="min-w-0">
              <div className="w-full animate-pulse bg-gray-200" style={cardSkeletonStyle} />
            </div>
          ))}
        </div>
        <div
          className="grid grid-cols-2 justify-items-center md:hidden"
          style={{
            columnGap: SPECIAL_OFFERS_MOBILE_GRID_COLUMN_GAP_PX,
            rowGap: SPECIAL_OFFERS_MOBILE_GRID_ROW_GAP_PX,
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="min-w-0 w-full max-w-[168px]">
              <div className="w-full animate-pulse bg-gray-200" style={cardSkeletonStyle} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

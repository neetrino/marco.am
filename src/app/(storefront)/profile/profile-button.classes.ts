import { MARCO_SLATE_PILL_BUTTON_CLASS } from '@/lib/constants/marco-brand-colors';

const PROFILE_SLATE_BUTTON_BASE = `${MARCO_SLATE_PILL_BUTTON_CLASS} !rounded-full transition-[filter]`;

/** Save / submit / add — former black primary actions. */
export const PROFILE_PRIMARY_BUTTON_CLASS = `${PROFILE_SLATE_BUTTON_BASE} !px-4 sm:!px-6 !py-3`;

/** Compact slate CTA (start shopping, reorder). */
export const PROFILE_PRIMARY_COMPACT_BUTTON_CLASS = `${PROFILE_SLATE_BUTTON_BASE} !h-10 !border-0 !px-5 !text-sm !font-medium`;

/** Outline / cancel — white background (unchanged from original). */
export const PROFILE_OUTLINE_BUTTON_CLASS = 'whitespace-nowrap !rounded-full !px-4 sm:!px-6 !py-3';

export const PROFILE_OUTLINE_COMPACT_BUTTON_CLASS =
  '!h-10 !rounded-full !border !border-gray-300 !bg-white !px-5 !text-sm !font-medium !text-gray-700 transition-colors hover:!bg-gray-50 dark:!border-[#ffffff] dark:!bg-[#ffffff] dark:!text-[#383838] dark:hover:!bg-[#f2f2f2]';

/** Pagination — default outline pill. */
export const PROFILE_PAGINATION_BUTTON_CLASS = 'rounded-full px-4';

/** Dashboard quick-action tiles — white background. */
export const PROFILE_QUICK_ACTION_BUTTON_CLASS =
  'inline-flex w-full items-center justify-center whitespace-nowrap rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50';

/** Orders status filter — inactive pill (white). */
export const PROFILE_FILTER_INACTIVE_CLASS =
  'rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50';

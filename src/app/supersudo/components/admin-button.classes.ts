import { MARCO_SLATE_PILL_BUTTON_CLASS } from '@/lib/constants/marco-brand-colors';

/** Save / submit / retry — former black or slate-900 primary actions. */
export const ADMIN_PRIMARY_BUTTON_CLASS = `${MARCO_SLATE_PILL_BUTTON_CLASS} rounded-lg px-4 py-2 text-sm font-medium transition-[filter]`;

/** Compact slate CTA (internal notes save, etc.). */
export const ADMIN_PRIMARY_COMPACT_BUTTON_CLASS = `${MARCO_SLATE_PILL_BUTTON_CLASS} rounded-lg px-3 py-1.5 text-sm font-medium transition-[filter] disabled:cursor-not-allowed disabled:opacity-60`;

/** Filter panel toggle — open state (was slate-900). */
export const ADMIN_FILTER_TOGGLE_ACTIVE_CLASS =
  'bg-[var(--marco-slate)] text-white hover:brightness-95';

/** Locale / option pill — active state in modals. */
export const ADMIN_LOCALE_TAB_ACTIVE_CLASS =
  'border-[var(--marco-slate)] bg-[var(--marco-slate)] text-white';

/** Segmented control tab — active state (product type, etc.). */
export const ADMIN_SEGMENT_TAB_ACTIVE_CLASS =
  'bg-[var(--marco-slate)] text-white shadow-md ring-1 ring-[var(--marco-slate)]/10';

/** Avatar / initials chip on dashboard activity rows. */
export const ADMIN_AVATAR_CHIP_CLASS =
  'bg-[var(--marco-slate)] text-xs font-bold text-white';

/** Currency code badge on settings cards. */
export const ADMIN_CODE_BADGE_CLASS =
  'bg-[var(--marco-slate)] text-xs font-bold tracking-[0.14em] text-marco-yellow';

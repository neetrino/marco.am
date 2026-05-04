/**
 * Mobile drawer (hamburger) — pill layout aligned with MARCO tokens (Figma-style nav reference).
 */

/**
 * Full-viewport sheet (portal to `document.body` — use `dvh`, not `h-full`).
 * `overflow-hidden` + child `min-h-0` keeps the scroll region from colliding with the footer.
 */
/** Light: iOS-style grouped list chrome (`#F2F2F7`). Dark: full-bleed sheet. */
export const MOBILE_DRAWER_PANEL_CLASS =
  'flex h-[100dvh] max-h-[100dvh] w-full min-w-0 touch-auto flex-col overflow-hidden bg-[#F2F2F7] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] dark:bg-zinc-950';

/**
 * Full usable width inside drawer horizontal padding — pill “length” scales per device.
 */
export const MOBILE_DRAWER_CONTENT_MAX_CLASS =
  'mx-auto w-full min-w-0 max-w-full';

export const MOBILE_DRAWER_CLOSE_BTN_CLASS =
  'flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-marco-gray text-marco-black transition-opacity hover:opacity-90 dark:bg-zinc-800 dark:text-white';

/** Logged-in profile row — white card, large radius (reference: mobile Profile header). */
export const MOBILE_DRAWER_PROFILE_CARD_CLASS =
  'flex w-full min-w-0 items-center gap-4 rounded-[20px] bg-white px-4 py-3.5 text-left shadow-sm ring-1 ring-black/[0.06] transition-colors hover:bg-neutral-50 active:bg-neutral-100 dark:bg-zinc-900 dark:ring-white/10 dark:hover:bg-zinc-800/90 dark:active:bg-zinc-800';

/** Primary line (name) on profile card */
export const MOBILE_DRAWER_PROFILE_CARD_PRIMARY_CLASS =
  'truncate text-base font-bold text-marco-black dark:text-white';

/** Secondary line (email) — system secondary label */
export const MOBILE_DRAWER_PROFILE_CARD_SECONDARY_CLASS =
  'truncate text-sm font-medium text-[#8E8E93] dark:text-zinc-400';

/** Centered drawer title + absolutely positioned close (Profile-style top bar). */
export const MOBILE_DRAWER_MENU_HEADER_ROW_CLASS =
  'relative flex min-h-[52px] shrink-0 items-center justify-center px-1 pb-2 pt-1';

/** Circular avatar placeholder (no image URL in session). */
export const MOBILE_DRAWER_PROFILE_AVATAR_CLASS =
  'flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-marco-gray text-[15px] font-bold uppercase text-marco-black dark:bg-zinc-800 dark:text-white';

export const MOBILE_DRAWER_CTA_PILL_CLASS =
  'flex min-h-[3.5rem] w-full items-center justify-center rounded-full bg-marco-yellow px-6 py-4 text-center text-xs font-bold uppercase tracking-wide text-marco-black transition-[filter] duration-200 hover:brightness-95 active:brightness-90';

/** Footer “Call” (and similar) — shorter than primary Shop CTA to match nav proportions. */
export const MOBILE_DRAWER_CTA_COMPACT_CLASS =
  'flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-full bg-marco-yellow px-5 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-marco-black transition-[filter] duration-200 hover:brightness-95 active:brightness-90';

export const MOBILE_DRAWER_MUTED_PILL_CLASS =
  'flex min-h-[3.5rem] w-full items-center justify-between gap-3.5 rounded-full bg-marco-gray px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-marco-black dark:bg-zinc-800 dark:text-white';

export const MOBILE_DRAWER_CONTACT_OUTLINE_CLASS =
  'flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-full border-2 border-marco-black bg-white px-5 py-3 text-sm font-bold text-marco-black transition-colors hover:bg-marco-gray/40 dark:border-white dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-800';

export function mobileDrawerNavPillClass(active: boolean): string {
  const base =
    'flex min-h-[3.5rem] w-full items-center justify-between gap-3.5 rounded-full border px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wide transition-[background-color,border-color,color,filter] duration-200';
  if (active) {
    return `${base} border-transparent bg-marco-yellow text-marco-black`;
  }
  return `${base} border-marco-black/12 bg-white text-marco-black hover:border-marco-black/30 dark:border-white/12 dark:bg-zinc-900 dark:text-white dark:hover:border-white/28`;
}

/** Smaller pills — drawer call flow / auxiliary rows. */
export function mobileDrawerCompactPillClass(active: boolean, centered = false): string {
  const justify = centered ? 'justify-center' : 'justify-between';
  const textAlign = centered ? 'text-center' : 'text-left';
  const base =
    `flex min-h-[3.125rem] w-full items-center ${justify} gap-2.5 rounded-full border px-6 py-3.5 ${textAlign} text-xs font-semibold leading-snug normal-case transition-[background-color,border-color,color,filter] duration-200`;
  if (active) {
    return `${base} border-transparent bg-marco-yellow text-marco-black`;
  }
  return `${base} border-marco-black/12 bg-white text-marco-black hover:border-marco-black/25 dark:border-white/12 dark:bg-zinc-900 dark:text-white dark:hover:border-white/20`;
}

/** Compact tel row inside drawer call flow. */
export const MOBILE_DRAWER_CONTACT_COMPACT_CLASS =
  'flex min-h-[3.125rem] w-full items-center justify-center gap-2 rounded-full border-2 border-marco-black bg-white px-5 py-3 text-center text-xs font-bold tabular-nums text-marco-black transition-colors hover:bg-marco-gray/35 dark:border-white dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-800';

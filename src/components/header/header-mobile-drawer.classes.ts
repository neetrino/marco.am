/**
 * Mobile drawer (hamburger) — pill layout aligned with MARCO tokens (Figma-style nav reference).
 */

/**
 * Full-viewport sheet (portal to `document.body` — use `dvh`, not `h-full`).
 * `overflow-hidden` + child `min-h-0` keeps the scroll region from colliding with the footer.
 */
export const MOBILE_DRAWER_PANEL_CLASS =
  'flex h-[100dvh] max-h-[100dvh] w-full min-w-0 touch-auto flex-col overflow-hidden bg-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] dark:bg-zinc-950';

/**
 * Centered column — narrower stack (“shorter” width) with side breathing room.
 */
export const MOBILE_DRAWER_CONTENT_MAX_CLASS =
  'mx-auto w-full max-w-[min(19.5rem,78vw)] min-w-0';

export const MOBILE_DRAWER_CLOSE_BTN_CLASS =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-marco-gray text-marco-black transition-opacity hover:opacity-90 dark:bg-zinc-800 dark:text-white';

export const MOBILE_DRAWER_USER_PILL_CLASS =
  'flex min-h-11 w-full items-center justify-between gap-2.5 rounded-full bg-marco-black px-4 py-2.5 text-left text-sm font-bold uppercase tracking-wide text-white dark:bg-marco-black';

export const MOBILE_DRAWER_CTA_PILL_CLASS =
  'flex min-h-11 w-full items-center justify-center rounded-full bg-marco-yellow px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-marco-black transition-[filter] duration-200 hover:brightness-95 active:brightness-90';

export const MOBILE_DRAWER_MUTED_PILL_CLASS =
  'flex min-h-11 w-full items-center justify-between gap-2.5 rounded-full bg-marco-gray px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-marco-black dark:bg-zinc-800 dark:text-white';

export const MOBILE_DRAWER_CONTACT_OUTLINE_CLASS =
  'flex min-h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-marco-black bg-white px-3 py-2 text-sm font-bold text-marco-black transition-colors hover:bg-marco-gray/40 dark:border-white dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-800';

export function mobileDrawerNavPillClass(active: boolean): string {
  const base =
    'flex min-h-11 w-full items-center justify-between gap-2.5 rounded-full border px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide transition-[background-color,border-color,color,filter] duration-200';
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
    `flex w-full items-center ${justify} gap-2 rounded-full border px-3.5 py-2.5 ${textAlign} text-xs font-semibold leading-snug normal-case transition-[background-color,border-color,color,filter] duration-200`;
  if (active) {
    return `${base} border-transparent bg-marco-yellow text-marco-black`;
  }
  return `${base} border-marco-black/12 bg-white text-marco-black hover:border-marco-black/25 dark:border-white/12 dark:bg-zinc-900 dark:text-white dark:hover:border-white/20`;
}

/** Compact tel row inside drawer call flow. */
export const MOBILE_DRAWER_CONTACT_COMPACT_CLASS =
  'flex min-h-10 w-full items-center justify-center gap-2 rounded-full border-2 border-marco-black bg-white px-3 py-2 text-center text-xs font-bold tabular-nums text-marco-black transition-colors hover:bg-marco-gray/35 dark:border-white dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-800';

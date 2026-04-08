/**
 * Desktop header horizontal layout — non–home pages use this shell; home (`/`) uses
 * `HOME_PAGE_CONTAINER_CLASS` in `homePageLayout.ts` for the same width as page content.
 * @see Header.tsx
 */

/** Matches `<header>` / banner wrapper: same distance from left and right viewport edges. */
export const HEADER_VIEWPORT_LEFT_INSET_CLASS =
  'px-6 lg:px-10 min-[1920px]:px-14';

/** Design max width (Figma top header frame: 1923px). Fluid gutters — logo / search / banner share this box. */
export const HEADER_DESKTOP_SHELL_CLASS =
  'mx-auto w-full max-w-[1923px] px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 min-[1920px]:px-[151px]';

/**
 * Top header row outer frame (Figma): `flex-direction: column`, `align-items: flex-start`, `gap: 10px`.
 * Inner content row stays horizontal via a nested `flex flex-wrap` row.
 */
export const HEADER_TOP_ROW_FRAME_CLASS = 'flex flex-col items-start gap-[10px]';

/**
 * Home horizontal rhythm — see `.marco-home-page-shell` / `.marco-home-inner-gutter` in `globals.css`.
 * Tablet/iPad (768–1366px): symmetric 1rem gutters + centered `max-w-7xl`, aligned with header/footer.
 */

/** Full section shell (`max-w-7xl` + horizontal padding). */
export const HOME_PAGE_SECTION_SHELL_CLASS = 'marco-home-page-shell' as const;

/** Same shell + tighter horizontal padding below `md`. */
export const HOME_PAGE_SECTION_SHELL_TIGHT_MOBILE_CLASS =
  'marco-home-page-shell marco-home-page-shell--tight-mobile' as const;

/** Padding only — nested rows inside a full-bleed section. */
export const HOME_PAGE_INNER_GUTTER_CLASS = 'marco-home-inner-gutter' as const;

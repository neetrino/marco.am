/** Max products fetched for the home special-offers strip (API `limit`; matches `HomeSpecialOffersSection`). */
export const SPECIAL_OFFERS_PRODUCTS_LIMIT = 12;

/** Products per carousel page — matches Figma desktop row of four cards. */
export const SPECIAL_OFFERS_CARDS_PER_PAGE = 4;

/** New arrivals home: one view = 2 rows × 4 columns (8 cards). */
export const NEW_ARRIVALS_CARDS_PER_VIEW = 8;

/** Fetch enough for exactly two browse pages (2 × 8 cards) — prev/next + two dots. */
export const NEW_ARRIVALS_FETCH_LIMIT = 16;

/**
 * Figma Frame 254 (`101:3471`) — desktop strip measurements (px).
 * Keep in sync with Tailwind in `HomeSpecialOffersSection` / `SpecialOfferProductCard`
 * (`w-[306px]`, `gap-x-[106px]`).
 */
export const SPECIAL_OFFER_CARD_WIDTH_PX = 306;

/** @see SPECIAL_OFFER_CARD_WIDTH_PX */
export const SPECIAL_OFFER_CARD_ROW_GAP_PX = 106;

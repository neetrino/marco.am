import type { CSSProperties } from 'react';

import { HOME_PRODUCT_MOBILE_RAIL_PAGE_WIDTH_CSS_VAR } from './home-special-offers.constants';

/** One horizontal snap segment — width comes from the scrollport CSS variable. */
export function homeProductMobileRailPageSlideStyles(): CSSProperties {
  const v = HOME_PRODUCT_MOBILE_RAIL_PAGE_WIDTH_CSS_VAR;
  return {
    width: `var(${v}, 100%)`,
    minWidth: `var(${v}, 100%)`,
    flex: `0 0 var(${v}, 100%)`,
    maxWidth: `var(${v}, 100%)`,
  };
}

'use client';

import { MarcoFigmaFooterAboutColumn } from './MarcoFigmaFooterAboutColumn';
import { MarcoFigmaFooterCompanyColumn } from './MarcoFigmaFooterCompanyColumn';
import { MarcoFigmaFooterContactColumn } from './MarcoFigmaFooterContactColumn';
import { MarcoFigmaFooterPayment } from './MarcoFigmaFooterPayment';
import { MarcoFigmaFooterSocial } from './MarcoFigmaFooterSocial';
import { MarcoFigmaFooterSupportColumn } from './MarcoFigmaFooterSupportColumn';

/**
 * Подвал как в Figma FOOTER — 101:2835.
 */
export function MarcoFigmaFooter() {
  return (
    <footer
      className="relative w-[1920px] shrink-0 bg-[#f2f2f2] pb-10 pt-10 font-montserrat-arm"
      data-name="FOOTER"
      data-node-id="101:2835"
    >
      <div className="mx-auto grid max-w-[1572px] grid-cols-1 gap-12 px-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-16">
        <MarcoFigmaFooterAboutColumn />
        <MarcoFigmaFooterCompanyColumn />
        <MarcoFigmaFooterSupportColumn />
        <MarcoFigmaFooterContactColumn />
      </div>
      <MarcoFigmaFooterSocial />
      <MarcoFigmaFooterPayment />
    </footer>
  );
}

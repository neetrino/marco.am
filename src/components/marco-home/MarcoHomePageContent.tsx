'use client';

import { HeroSection } from '../HeroSection';
import { HomeBannersSection } from './HomeBannersSection';
import { HomeBrandsSection } from './HomeBrandsSection';
import { HomeNewsSection } from './HomeNewsSection';
import { HomeReelsSection } from './HomeReelsSection';
import { HomeSpecialSection } from './HomeSpecialSection';
import { MarcoFigmaFooter } from './MarcoFigmaFooter';

/**
 * Главная MARCO HOME — Figma 101:2781 (HEADER из layout).
 */
export function MarcoHomePageContent() {
  return (
    <div className="min-w-0 bg-white">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-[1920px]">
          <HeroSection />
          <HomeReelsSection />
          <HomeSpecialSection />
          <HomeNewsSection />
          <HomeBrandsSection />
          <HomeBannersSection />
          <MarcoFigmaFooter />
        </div>
      </div>
    </div>
  );
}

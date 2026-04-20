'use client';
import { useTranslation } from '../lib/i18n-client';
import { HomePromoMobileHeroChair } from './home/HomePromoMobileHeroChair';
import { HomePromoMobileHeroHeadline } from './home/HomePromoMobileHeroHeadline';
import { HomePromoMobileHeroSlateCta } from './home/HomePromoMobileHeroSlateCta';
import { HomePromoMobileHeroSlateLabel } from './home/HomePromoMobileHeroSlateLabel';
import { HomePromoMobileHeroSlatePanel } from './home/HomePromoMobileHeroSlatePanel';
import { HeroCarouselSlides } from './HeroCarouselSlides';
import { HOME_PAGE_SECTION_SHELL_CLASS } from './home/home-page-section-shell.constants';

/** Hero shell follows the same responsive width rhythm as the whole home page. */
const HERO_PAGE_CONTAINER_CLASS = `${HOME_PAGE_SECTION_SHELL_CLASS} pt-6 sm:pt-9 lg:pt-8`;

/** Desktop hero tiles from Figma (1023:2720, 1023:2721, 1023:2719). */
const HERO_DESKTOP_LEFT_TOP_BG = 'https://www.figma.com/api/mcp/asset/3791ef5c-cb75-4fdf-b91c-867dfea32623';
const HERO_DESKTOP_LEFT_BOTTOM_BG = 'https://www.figma.com/api/mcp/asset/dacdd4e4-d6c3-496f-9f3a-ea1efac284f4';
const HERO_DESKTOP_RIGHT_BG = 'https://www.figma.com/api/mcp/asset/b7429ac7-5d98-4c42-a62f-f9780ebfda16';

export function HeroCarousel() {
  const { t } = useTranslation();

  return (
    <div className={HERO_PAGE_CONTAINER_CLASS} id="hero">
      <div className="relative aspect-[141/79] min-h-[260px] w-full min-w-0 overflow-hidden rounded-[32px] bg-marco-yellow box-border sm:min-h-[320px] md:aspect-[141/68] md:min-h-0 md:bg-transparent">
        <div className="md:hidden">
          <HeroCarouselSlides />
          <HomePromoMobileHeroSlatePanel />
          <HomePromoMobileHeroSlateLabel />
          <HomePromoMobileHeroChair />
          <HomePromoMobileHeroSlateCta />
          <div className="pointer-events-none absolute inset-0 z-[14] flex flex-col md:hidden">
            <div className="box-border w-full min-w-0 max-w-full px-4 pt-8 sm:px-5 sm:pt-9">
              <HomePromoMobileHeroHeadline
                emphasisText={t('home.promo_banner_headline_emphasis')}
                accentText={t('home.promo_banner_headline_accent')}
              />
            </div>
          </div>
        </div>

        <div className="hidden h-full w-full grid-cols-[minmax(0,1.24fr)_minmax(0,0.96fr)] gap-3 md:grid md:p-0 lg:gap-4 lg:p-0">
          <div className="grid h-full min-w-0 grid-rows-2 gap-3 lg:gap-4">
            <div
              className="h-full min-w-0 rounded-[30px] bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${HERO_DESKTOP_LEFT_TOP_BG})`, backgroundPosition: 'center 16%' }}
              aria-label="CASEKOO Accessories"
            />
            <div
              className="h-full min-w-0 rounded-[30px] bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${HERO_DESKTOP_LEFT_BOTTOM_BG})`, backgroundPosition: 'center 58%' }}
              aria-label="Xming projector"
            />
          </div>
          <div
            className="h-full min-w-0 rounded-[30px] bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${HERO_DESKTOP_RIGHT_BG})`, backgroundPosition: 'center 58%' }}
            aria-label="Galaxy A05s hero"
          />
        </div>
      </div>
    </div>
  );
}

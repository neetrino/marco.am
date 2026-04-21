'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '../lib/i18n-client';
import { HomePromoMobileHeroChair } from './home/HomePromoMobileHeroChair';
import { HomePromoMobileHeroHeadline } from './home/HomePromoMobileHeroHeadline';
import { HomePromoMobileHeroSlateCta } from './home/HomePromoMobileHeroSlateCta';
import { HomePromoMobileHeroSlateLabel } from './home/HomePromoMobileHeroSlateLabel';
import { HomePromoMobileHeroSlatePanel } from './home/HomePromoMobileHeroSlatePanel';
import { HeroCarouselSlides } from './HeroCarouselSlides';
import { HERO_MOBILE_PRIMARY_IMAGE_SRC } from './hero.constants';
import { HOME_PAGE_SECTION_SHELL_CLASS } from './home/home-page-section-shell.constants';

/** Hero shell follows the same responsive width rhythm as the whole home page. */
const HERO_PAGE_CONTAINER_CLASS = `${HOME_PAGE_SECTION_SHELL_CLASS} pt-8 sm:pt-11 lg:pt-10`;

/** Desktop hero tiles from Figma (1023:2720, 1023:2721, 1023:2719). */
const HERO_DESKTOP_LEFT_TOP_BG = 'https://www.figma.com/api/mcp/asset/3791ef5c-cb75-4fdf-b91c-867dfea32623';
const HERO_DESKTOP_LEFT_BOTTOM_BG = 'https://www.figma.com/api/mcp/asset/dacdd4e4-d6c3-496f-9f3a-ea1efac284f4';
const HERO_DESKTOP_RIGHT_BG = 'https://www.figma.com/api/mcp/asset/b7429ac7-5d98-4c42-a62f-f9780ebfda16';
const HERO_DESKTOP_HELP_MESSAGE_ICON_SRC = '/assets/hero/hero-help-message-icon.svg';

export function HeroCarousel() {
  const { t } = useTranslation();

  return (
    <div className={HERO_PAGE_CONTAINER_CLASS} id="hero">
      <div className="relative aspect-[141/79] min-h-[260px] w-full min-w-0 overflow-hidden rounded-[32px] bg-marco-yellow box-border sm:min-h-[320px] md:aspect-[141/68] md:min-h-0 md:bg-transparent">
        {/* Guaranteed mobile hero background texture pinned to top edge. */}
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-cover bg-top bg-no-repeat md:hidden"
          style={{ backgroundImage: `url(${HERO_MOBILE_PRIMARY_IMAGE_SRC})`, backgroundPosition: 'center top' }}
          aria-hidden
        />
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
            className="relative h-full min-w-0 rounded-[30px] bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${HERO_DESKTOP_RIGHT_BG})`, backgroundPosition: 'center 58%' }}
            aria-label="Galaxy A05s hero"
          >
            <div className="absolute bottom-[18px] right-[18px] z-[2] flex items-center gap-2.5 lg:bottom-[22px] lg:right-[22px] lg:gap-3">
              <div className="rounded-[68px] bg-white px-4 py-2 shadow-[0px_4px_24px_0px_rgba(150,150,150,0.28)] lg:px-5 lg:py-2.5">
                <p className="font-bold text-[13px] leading-5 text-[#181111] whitespace-nowrap lg:text-[14px]">
                  Ինչո՞վ կարող ենք ձեզ օգնել
                </p>
              </div>
              <Link
                href="/contact"
                className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#FACC15] transition-transform hover:-translate-y-0.5 lg:h-[64px] lg:w-[64px]"
                aria-label="Կապնվել մեզ հետ"
              >
                <Image
                  src={HERO_DESKTOP_HELP_MESSAGE_ICON_SRC}
                  alt=""
                  width={30}
                  height={30}
                  className="h-[30px] w-[30px] object-contain lg:h-[32px] lg:w-[32px]"
                  aria-hidden
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

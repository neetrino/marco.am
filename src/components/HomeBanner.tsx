'use client';

import Image from 'next/image';
import Link from 'next/link';
import { montserratArm } from '../fonts/montserrat-arm';
import { CtaArrowCircleIcon } from './icons/CtaArrowCircleIcon';
import { MessageSolidIcon } from './icons/MessageSolidIcon';
import { useTranslation } from '../lib/i18n-client';
import { HOME_HERO_BANNER_HEADER_GAP_PX } from '@/constants/homePageLayout';

/**
 * Hero assets. `bgTexture`: yellow brick wall (portrait); `object-cover` crops to banner aspect.
 * Figma MCP `/api/mcp/asset/*` URLs expire (~7 days); product and UI rasters are stored under `/public/images/`.
 * Overlay ref ~1714×924.
 */
const ASSETS = {
  bgTexture: '/images/home-banner-brick-bg.png',
  /** BANNER 1 — Figma node `305:2147` (631×606 ref); exported PNG, not MCP hotlink. */
  banner1: '/images/home-banner-305-2147.png',
  /** Group 9233 — Figma `305:2115` (black circle + yellow arrow); local SVG matches MCP export. */
  linkIcon1: '/images/home-banner-banner2-link-icon.svg',
  /** Group 9233 — Figma node `305:2131` (BANNER3); local export (white circle + arrow). */
  linkIcon2: '/images/home-banner-banner3-link-icon.svg',
  /** BANNER2 1 — Figma node 305:2151, downloaded locally (404×556 px). */
  banner2: '/images/home-banner-305-2151.png',
  /** BANNER3 1 — Figma node 305:2154, downloaded locally (772×834 px). */
  banner3: '/images/home-banner-305-2154.png',
  /** Ellipse 87 — Figma node 101:4070; soft white circle + shadow (SVG export). */
  ellipse87: '/images/home-banner-101-4070.svg',
} as const;

/** Hero overlay copy — paths under `home.hero_banner.*` in locales. */
type HeroBannerCopy = {
  free: string;
  delivery: string;
  buyNow: string;
  more: string;
  newLabel: string;
  generation: string;
  smartphones: string;
  sofaProductName: string;
  sofaBrand: string;
};

/** Figma Mask group 1 (305:2146) — background plate. */
const MASK_BG_W = 1651;
const MASK_BG_H = 925;

/** Desktop frame max width — matches `HOME_PAGE_CONTAINER_CLASS` (`max-w-[1600px]`). */
const HERO_DESKTOP_MAX_WIDTH_PX = 1600;

/** Figma Group 9275 reference — overlay scaled to MASK_BG_*. */
const LAYOUT_REF_W = 1714;
const LAYOUT_REF_H = 924;

function bx(n: number): number {
  return Math.round((n * MASK_BG_W) / LAYOUT_REF_W);
}

function by(n: number): number {
  return Math.round((n * MASK_BG_H) / LAYOUT_REF_H);
}

/** Nudges all foreground layers slightly left (px); tune if layout feels off-center. */
const OVERLAY_SHIFT_X = -60;

/** Extra nudge for the left (sofa) card only — product block vs. dark panel (px). */
const SOFA_CARD_SHIFT_X = -22;

/**
 * Vertical nudge for cards right of center (delivery + electronics) and matching bottom strip.
 * Layout-ref Y delta; scales with `by()`. Lower = higher on screen.
 */
const RIGHT_OF_CENTER_TOP_NUDGE_REF = 12;

/** Layout-ref X for `hero_banner_promo` block; increase to move copy toward the right. */
const PROMO_COPY_LEFT_REF = 880;

/** Right inset (layout-ref) for the lower promo strip so the help CTA can align right. */
const PROMO_STRIP_RIGHT_REF = 48;

/**
 * Ellipse 87 — Figma 101:4070 (MARCO): 100×100 px frame; inner icon (mynaui:message-solid).
 * @see https://www.figma.com/design/7PlNcJ5BjWztGqYNYfsH2D/MARCO?node-id=101-4070
 */
const ELLIPSE87_BOX_PX = 80;
const ELLIPSE87_ICON_PX = 40;

/**
 * BANNER2 1 (`305:2151`) + overlay BANNER2 (`305:2161`) — layout-ref space.
 * Background: x=890, y=124, w=404, h=556.
 * Group 9233 link icon `305:2115`: x=1206, y=119, ~86.9×86.5. CTA `305:2110`: x=965, y=584.
 */
const DELIVERY_BANNER_BG_LEFT_REF = 890;
const DELIVERY_BANNER_BG_W_REF = 404;
const DELIVERY_BANNER_BG_H_REF = 556;
/** Document Y = 124 → `y(80)` with `RIGHT_OF_CENTER_TOP_NUDGE_REF`. */
const DELIVERY_BANNER_BG_TOP_N_REF = 80;
/** Group 9233 (`305:2115`): doc y=119 → `y(75)`. */
const DELIVERY_LINK_ICON_LEFT_REF = 1206;
/** Layout-ref px — optical nudge right vs Figma. */
const DELIVERY_LINK_ICON_SHIFT_RIGHT_REF = 10;
const DELIVERY_LINK_ICON_TOP_N_REF = 75;
/** Figma ref px — `bx`/`by` scale to mask. */
const DELIVERY_LINK_ICON_W_REF = 86.924;
const DELIVERY_LINK_ICON_H_REF = 86.524;

/**
 * BANNER3 1 (`305:2154`) + overlay — layout-ref space.
 * Card: x=1337, y=124, w=516, h=557. Group 9233 link icon `305:2131`: x=1659, y=124, 86×86.
 * CTA ~250×56 centered: x = 1337 + (516−250)/2 = 1470; align row with BANNER2 CTA (doc y=584 → `y(540)`).
 */
const ELECTRONICS_CARD_LEFT_REF = 1337;
const ELECTRONICS_CARD_W = 516;
const ELECTRONICS_CARD_H = 557;
/** Document Y = 124 → `y(80)` with `RIGHT_OF_CENTER_TOP_NUDGE_REF`. */
const ELECTRONICS_CARD_TOP_N_REF = 80;
const ELECTRONICS_LINK_ICON_LEFT_REF = 1659;
const ELECTRONICS_BUY_CTA_LEFT_REF = ELECTRONICS_CARD_LEFT_REF + (ELECTRONICS_CARD_W - 250) / 2;
/** Optical nudge left vs centered "More" pill; aligns with left-aligned copy above. Layout-ref px. */
const ELECTRONICS_MORE_CTA_NUDGE_LEFT_REF = 48;
const DELIVERY_BUY_CTA_LEFT_REF = 965; // Figma 305:2110 x=965

/** Figma HERO: `305:2147` — x=174, y=225, w=631, h=606 (layout-ref space). */
const SOFA_BANNER_LEFT_REF = 174;
const SOFA_BANNER_TOP_REF = 225;
const SOFA_BANNER_W_REF = 631;
const SOFA_BANNER_H_REF = 606;

/**
 * Left product card — BANNER 1 (Figma `305:2147`); single raster + copy/CTA overlays.
 */
function SofaCard({ copy }: { copy: HeroBannerCopy }) {
  const x = (n: number) => bx(n) + SOFA_CARD_SHIFT_X;

  return (
    <>
      <div
        className="absolute z-0 overflow-hidden rounded-[36px]"
        style={{
          left: bx(SOFA_BANNER_LEFT_REF) + SOFA_CARD_SHIFT_X,
          top: by(SOFA_BANNER_TOP_REF),
          width: bx(SOFA_BANNER_W_REF),
          height: by(SOFA_BANNER_H_REF),
        }}
      >
        <Image
          src={ASSETS.banner1}
          alt={copy.sofaProductName}
          fill
          className="object-cover object-center"
          unoptimized
        />
      </div>

      {/* Product label */}
      <div
        className={`${montserratArm.className} absolute z-10 text-base leading-[1.49] text-white antialiased`}
        style={{ left: x(195), top: by(712) }}
      >
        <p>{copy.sofaProductName}</p>
        <p>{copy.sofaBrand}</p>
      </div>

      <Link
        href="/products"
        className="absolute z-10 flex items-center justify-center overflow-hidden rounded-[68px] bg-[#facc15] py-1 pl-4 pr-14 antialiased dark:!text-[#050505]"
        style={{ left: x(524), top: by(700), width: bx(243), height: by(56) }}
      >
        <span
          className={`${montserratArm.className} min-w-0 text-center text-base font-bold leading-6 text-[#000] dark:!text-[#050505]`}
        >
          {copy.buyNow}
        </span>
        <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2">
          <CtaArrowCircleIcon className="size-12 shrink-0" />
        </span>
      </Link>
    </>
  );
}

/**
 * Middle card — BANNER2 1 (Figma 305:2151).
 * Full-bleed raster: boxes photo fills the card, text + truck icon overlaid,
 * frosted-glass bottom panel with "Buy now" CTA.
 */
function DeliveryCard({ copy }: { copy: HeroBannerCopy }) {
  const y = (n: number) => by(n + RIGHT_OF_CENTER_TOP_NUDGE_REF);

  return (
    <>
      {/* Full card — BANNER2 1 (`305:2151`); overlay BANNER2 (`305:2161`) below */}
      <div
        className="absolute overflow-hidden rounded-[36px]"
        style={{
          left: bx(DELIVERY_BANNER_BG_LEFT_REF),
          top: y(DELIVERY_BANNER_BG_TOP_N_REF),
          width: bx(DELIVERY_BANNER_BG_W_REF),
          height: by(DELIVERY_BANNER_BG_H_REF),
        }}
      >
        <Image
          src={ASSETS.banner2}
          alt=""
          fill
          className="object-cover object-center"
          unoptimized
        />
      </div>

      {/* Group 9233 — Figma `305:2115` */}
      <div
        className="absolute z-10"
        style={{
          left: bx(DELIVERY_LINK_ICON_LEFT_REF + DELIVERY_LINK_ICON_SHIFT_RIGHT_REF),
          top: y(DELIVERY_LINK_ICON_TOP_N_REF),
          width: bx(DELIVERY_LINK_ICON_W_REF),
          height: by(DELIVERY_LINK_ICON_H_REF),
        }}
      >
        <Image src={ASSETS.linkIcon1} alt="" fill className="object-contain" unoptimized />
      </div>

      {/* CTA — Figma 305:2110: x=965, y=584 */}
      <Link
        href="/products"
        className={`${montserratArm.className} absolute z-10 flex items-center justify-center rounded-[60px] bg-black pt-[15.929px] pb-[16.071px] pl-[72.5px] pr-[72.5px] text-[16px] font-bold leading-[24px] text-white antialiased`}
        style={{ left: bx(DELIVERY_BUY_CTA_LEFT_REF), top: y(540) }}
      >
        {copy.buyNow}
      </Link>
    </>
  );
}

/**
 * Right card — new-arrivals promo (flush with texture right edge).
 */
function ElectronicsCard({ copy }: { copy: HeroBannerCopy }) {
  const y = (n: number) => by(n + RIGHT_OF_CENTER_TOP_NUDGE_REF);

  return (
    <>
      {/* Full card — BANNER3 1 (`305:2154`); overlays: `305:2131` + CTA */}
      <div
        className="absolute overflow-hidden rounded-[36px]"
        style={{
          left: bx(ELECTRONICS_CARD_LEFT_REF),
          top: y(ELECTRONICS_CARD_TOP_N_REF),
          width: bx(ELECTRONICS_CARD_W),
          height: by(ELECTRONICS_CARD_H),
        }}
      >
        <Image
          src={ASSETS.banner3}
          alt={copy.smartphones}
          fill
          className="object-cover object-center"
          unoptimized
        />
      </div>

      {/* Group 9233 — Figma `305:2131` (doc 1659,124); 86×86 ref px */}
      <div className="absolute z-10" style={{ left: bx(ELECTRONICS_LINK_ICON_LEFT_REF), top: y(80), width: bx(86), height: by(86) }}>
        <Image src={ASSETS.linkIcon2} alt="" fill className="object-contain" unoptimized />
      </div>

      {/* White "More" CTA — slightly left of center; row aligned with BANNER2 black CTA */}
      <Link
        href="/products"
        className={`${montserratArm.className} absolute z-10 flex items-center justify-center rounded-[60px] bg-black text-[16px] font-bold text-white antialiased transition-opacity hover:opacity-90`}
        style={{
          left: bx(ELECTRONICS_BUY_CTA_LEFT_REF - ELECTRONICS_MORE_CTA_NUDGE_LEFT_REF),
          top: y(540),
          height: by(56),
          width: bx(250),
        }}
      >
        {copy.more}
      </Link>
    </>
  );
}

/**
 * Ellipse 87 (Figma 101:4070) + message icon — to the right of the help CTA, vertically centered.
 * Wrapped in {@link HelpPromoEllipseButton} for navigation + keyboard focus.
 */
function HelpPromoEllipse() {
  return (
    <div
      className="relative shrink-0 rounded-full dark:bg-[var(--app-surface)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.38)]"
      style={{ width: ELLIPSE87_BOX_PX, height: ELLIPSE87_BOX_PX }}
    >
      <div className="relative size-full">
        <div className="absolute inset-[-24%] dark:opacity-0">
          <div className="relative size-full">
            <Image
              src={ASSETS.ellipse87}
              alt=""
              fill
              className="block max-w-none object-contain"
              unoptimized
            />
          </div>
        </div>
        <div className="absolute inset-0 z-10 flex items-center justify-center text-[#2F4B5D] dark:text-white">
          <div style={{ width: ELLIPSE87_ICON_PX, height: ELLIPSE87_ICON_PX }}>
            <MessageSolidIcon className="size-full shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Icon-only control next to the help CTA — same destination as the text link; `Link` for a11y + open in new tab. */
function HelpPromoEllipseButton({ ariaLabel }: { ariaLabel: string }) {
  return (
    <Link
      href="/contact"
      aria-label={ariaLabel}
      className="inline-flex shrink-0 cursor-pointer rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#101010]/30"
    >
      <HelpPromoEllipse />
    </Link>
  );
}

/**
 * Home page hero banner — background plate from Figma node 305:2146 (Mask group 1).
 * Texture 1651 × 925 px; overlay scaled from Figma ref 1714 × 924 to match.
 * Large desktop: fluid scale via container `cqw` so the hero fills the shared home content width.
 */
export function HomeBanner() {
  const { t } = useTranslation();

  const heroCopy: HeroBannerCopy = {
    free: t('home.hero_banner.free'),
    delivery: t('home.hero_banner.delivery'),
    buyNow: t('home.hero_banner.buy_now'),
    more: t('home.hero_banner.more'),
    newLabel: t('home.hero_banner.new'),
    generation: t('home.hero_banner.generation'),
    smartphones: t('home.hero_banner.smartphones'),
    sofaProductName: t('home.hero_banner.sofa_product_name'),
    sofaBrand: t('home.hero_banner.sofa_brand'),
  };

  const heroScale = `scale(calc(100cqw / ${MASK_BG_W}px))`;

  return (
    <section
      className="relative w-full overflow-x-hidden bg-transparent dark:bg-[var(--app-bg)]"
      style={{ marginTop: HOME_HERO_BANNER_HEADER_GAP_PX }}
    >
      <div className="w-full [container-type:inline-size]">
        <div
          className="relative w-full overflow-hidden rounded-[36px] bg-transparent dark:bg-[var(--app-surface)]"
          style={{ aspectRatio: `${MASK_BG_W} / ${MASK_BG_H}` }}
        >
            <div
              className="absolute left-0 top-0 z-0"
              style={{
                width: MASK_BG_W,
                height: MASK_BG_H,
                transform: heroScale,
                transformOrigin: 'top left',
              }}
            >
            {/* Mask group 1 — Figma 305:2146: 1651 × 925 px, rounded texture plate */}
            <div
              className="pointer-events-none absolute left-0 top-0 z-0 overflow-hidden rounded-[36px]"
              style={{ width: MASK_BG_W, height: MASK_BG_H }}
            >
              <Image
                src={ASSETS.bgTexture}
                alt=""
                fill
                className="object-cover object-center"
                priority
                sizes={`(max-width: 768px) 100vw, (max-width: ${HERO_DESKTOP_MAX_WIDTH_PX}px) 95vw, ${HERO_DESKTOP_MAX_WIDTH_PX}px`}
                unoptimized
              />
            </div>

            <div
              className="relative z-10 h-full"
              style={{ transform: `translateX(${OVERLAY_SHIFT_X}px)` }}
            >
              {/* Large headline — above sofa row, optical balance with mask corner */}
              <p
                className={`${montserratArm.className} absolute z-20 whitespace-nowrap font-black antialiased`}
                style={{ left: bx(162), top: by(88), fontSize: bx(60), lineHeight: `${by(72)}px` }}
              >
                <span className="home-banner-hero-stroke text-[#000]">{heroCopy.free} </span>
                <span className="home-banner-hero-stroke text-[#FFF]">{heroCopy.delivery}</span>
              </p>

              <SofaCard copy={heroCopy} />
              <DeliveryCard copy={heroCopy} />
              <ElectronicsCard copy={heroCopy} />

              {/* Promo sub-copy + help CTA; Ellipse 87 to the right of the help button (same row, right-aligned) */}
              <div
                className="absolute z-20 flex flex-col gap-4"
                style={{
                  left: bx(PROMO_COPY_LEFT_REF),
                  right: bx(PROMO_STRIP_RIGHT_REF),
                  top: by(668 + RIGHT_OF_CENTER_TOP_NUDGE_REF),
                }}
              >
                <p className="max-w-[min(560px,calc(100%-2rem))] whitespace-pre-line text-left text-[24px] font-bold leading-[1.15] text-white antialiased [text-shadow:0_1px_2px_rgba(0,0,0,0.25)]">
                  {t('home.hero_banner_promo')}
                </p>
                <div className="flex flex-row items-center justify-end gap-3 self-end sm:gap-4">
                  <Link
                    href="/contact"
                    className={`${montserratArm.className} flex h-[56px] w-[311px] shrink-0 flex-row items-center justify-center rounded-[68px] bg-[#2F4B5D] px-8 py-4 text-center text-base font-bold leading-6 text-[#FFF] shadow-[0_4px_24px_0_rgba(150,150,150,0.28)] antialiased`}
                  >
                    {t('home.hero_help_cta')}
                  </Link>
                  <HelpPromoEllipseButton ariaLabel={t('home.chat_fab_aria')} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

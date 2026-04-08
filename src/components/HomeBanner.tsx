'use client';

import Image from 'next/image';
import Link from 'next/link';
import { montserratArm } from '../fonts/montserrat-arm';
import { CtaArrowCircleIcon } from './icons/CtaArrowCircleIcon';
import { MessageSolidIcon } from './icons/MessageSolidIcon';
import { useTranslation } from '../lib/i18n-client';

/**
 * Hero assets. `bgTexture`: yellow brick wall (portrait); `object-cover` crops to banner aspect.
 * Other URLs — Figma MCP; refresh when expired (~7 days). Overlay ref ~1714×924.
 */
const ASSETS = {
  bgTexture: '/images/home-banner-brick-bg.png',
  sofa:          'https://www.figma.com/api/mcp/asset/1a5ccb5d-3c4f-45e8-8489-29d2d9124fd1',
  sofaCircle:    'https://www.figma.com/api/mcp/asset/2f91b1da-a2d5-43d1-b75f-f8c532cd6471',
  truckIcon:     'https://www.figma.com/api/mcp/asset/5249941e-732f-48e2-a3b4-bcadfc9d8ced',
  rightCardBg:   'https://www.figma.com/api/mcp/asset/3f677413-36ef-44bb-a898-711eec0caed7',
  linkIcon1:     'https://www.figma.com/api/mcp/asset/7e5dbdc4-4d4e-47a3-a26b-76000d469a4d',
  linkIcon2:     'https://www.figma.com/api/mcp/asset/01c4ecb0-959a-4403-a191-8d4fe959ea88',
  /** BANNER2 1 — Figma node 305:2151, downloaded locally (404×557 px). */
  banner2:       '/images/home-banner-305-2151.png',
  /** Ellipse 87 — Figma node 101:4070; soft white circle + shadow (100×100 ref px). */
  ellipse87:     'https://www.figma.com/api/mcp/asset/31e7a0d8-5588-4ef0-bf2f-1a635a53a79e',
} as const;

/** Armenian copy for fixed-layout banner blocks (Figma). */
const ARM = {
  gnel:        'ԳՆԵԼ',
  hima:        'ՀԻՄԱ',
  avelin:      'ԱՎԵԼԻՆ',
  free:        'ԱՆՎՃԱՐ',
  delivery:    'ԱՌԱՔՈՒՄ',
  nor:         'ՆՈՐ',
  serndi:      'ՍԵՐՆԴԻ',
  smartphones: 'ՍՄԱՐԹՖՈՆՆԵՐ',
  sofaName:    'Անկյունային բազմոց',
} as const;

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
 * Middle delivery card (878) — same horizontal inset as electronics card CTA (1394 − 1312 = 82 ref px).
 */
const DELIVERY_CARD_LEFT_REF = 878;
const ELECTRONICS_CARD_LEFT_REF = 1312;
const ELECTRONICS_BUY_CTA_LEFT_REF = 1394;
const DELIVERY_BUY_CTA_LEFT_REF =
  DELIVERY_CARD_LEFT_REF + (ELECTRONICS_BUY_CTA_LEFT_REF - ELECTRONICS_CARD_LEFT_REF);

/**
 * Left product card — sofa promo with stacked-card depth effect.
 */
function SofaCard() {
  const x = (n: number) => bx(n) + SOFA_CARD_SHIFT_X;

  return (
    <>
      {/* Stacked card backgrounds (scaleY-flip creates depth illusion) — scaled to MASK_BG_* */}
      <div className="absolute bg-white rounded-[36px] -scale-y-100" style={{ left: x(162), top: by(204), width: bx(629), height: by(475) }} />
      <div className="absolute bg-white rounded-[36px] -scale-y-100" style={{ left: x(162), top: by(204), width: bx(629), height: by(475) }} />
      <div className="absolute bg-[#c7c7c7] rounded-[36px] -scale-y-100" style={{ left: x(162), top: by(260), width: bx(629), height: by(477) }} />
      <div className="absolute bg-[#2f4b5d] rounded-[36px] -scale-y-100" style={{ left: x(162), top: by(323), width: bx(631), height: by(481) }} />

      {/* Sofa product image */}
      <div className="absolute" style={{ left: x(194), top: by(100), width: bx(563), height: by(563) }}>
        <Image src={ASSETS.sofa} alt={ARM.sofaName} fill className="object-contain" unoptimized />
      </div>

      {/* Decorative orbit ring below sofa */}
      <div className="absolute" style={{ left: x(274), top: by(502), width: bx(404), height: by(165) }}>
        <Image src={ASSETS.sofaCircle} alt="" fill className="object-contain" unoptimized />
      </div>

      {/* Product label */}
      <div
        className={`${montserratArm.className} absolute text-base leading-[1.49] text-white antialiased`}
        style={{ left: x(195), top: by(712) }}
      >
        <p>{ARM.sofaName}</p>
        <p>Bellini</p>
      </div>

      <Link
        href="/products"
        className="absolute flex items-center justify-center overflow-hidden rounded-[68px] bg-[#facc15] py-1 pl-4 pr-14 antialiased"
        style={{ left: x(524), top: by(700), width: bx(243), height: by(56) }}
      >
        <span
          className={`${montserratArm.className} min-w-0 text-center text-base font-bold leading-6 text-[#000]`}
        >
          {ARM.gnel} {ARM.hima}
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
function DeliveryCard() {
  return (
    <>
      {/* Full card — photo fills all 4 corners (rounded-[36px]) */}
      <div className="absolute overflow-hidden rounded-[36px]" style={{ left: bx(878), top: by(52), width: bx(403), height: by(556) }}>
        <Image
          src={ASSETS.banner2}
          alt=""
          fill
          className="object-cover object-center"
          unoptimized
        />
      </div>

      {/* Arrow/link icon — top-right of card */}
      <div className="absolute" style={{ left: bx(1194), top: by(52), width: bx(87), height: by(87) }}>
        <Image src={ASSETS.linkIcon1} alt="" fill className="object-contain" unoptimized />
      </div>

      {/* CTA — Figma 305:2110: flex, padding, rounded 60px, bg #000 */}
      <Link
        href="/products"
        className={`${montserratArm.className} absolute z-10 flex items-center justify-center rounded-[60px] bg-black pt-[15.929px] pb-[16.071px] pl-[72.5px] pr-[72.5px] text-[16px] font-bold leading-[24px] text-white antialiased`}
        style={{ left: bx(DELIVERY_BUY_CTA_LEFT_REF), top: by(502) }}
      >
        {ARM.gnel} {ARM.hima}
      </Link>
    </>
  );
}

/**
 * Right card — new-arrivals promo (flush with texture right edge).
 */
function ElectronicsCard() {
  return (
    <>
      {/* Pre-masked dark card background */}
      <div className="absolute" style={{ left: bx(1312), top: by(52), width: bx(402), height: by(556) }}>
        <Image src={ASSETS.rightCardBg} alt="" fill className="object-cover rounded-[36px]" unoptimized />
      </div>

      {/* Discount badge — inside the card, top-left */}
      <p
        className="absolute font-black whitespace-nowrap text-[#facc15] antialiased"
        style={{ left: bx(1350), top: by(137), fontSize: bx(78), lineHeight: `${by(63)}px` }}
      >
        80%
      </p>

      {/* Product image */}
      <div
        className="absolute"
        style={{ left: bx(1412), top: by(96), width: bx(389), height: by(366) }}
      >
        <Image src={ASSETS.sofa} alt="Product" fill className="object-cover" unoptimized />
      </div>

      {/* Sub-headline */}
      <div
        className={`${montserratArm.className} absolute font-black whitespace-nowrap antialiased`}
        style={{ left: bx(1350), top: by(378), fontSize: bx(28), lineHeight: `${by(33)}px` }}
      >
        <p className="text-[#facc15]">{ARM.nor}</p>
        <p className="text-white">{ARM.serndi}</p>
        <p className="text-white">{ARM.smartphones}</p>
      </div>

      {/* White "More" CTA */}
      <Link
        href="/products"
        className={`${montserratArm.className} absolute flex items-center justify-center rounded-[60px] bg-white text-[16px] font-bold text-black antialiased`}
        style={{ left: bx(1394), top: by(502), height: by(56), width: bx(250) }}
      >
        {ARM.avelin}
      </Link>

      {/* Arrow/link icon — right edge aligned to card (1312+402) */}
      <div className="absolute" style={{ left: bx(1628), top: by(53), width: bx(86), height: by(86) }}>
        <Image src={ASSETS.linkIcon2} alt="" fill className="object-contain" unoptimized />
      </div>
    </>
  );
}

/**
 * Ellipse 87 (Figma 101:4070) + message icon — to the right of the help CTA, vertically centered.
 */
function HelpPromoEllipse() {
  return (
    <div
      className="pointer-events-none relative shrink-0"
      style={{ width: ELLIPSE87_BOX_PX, height: ELLIPSE87_BOX_PX }}
    >
      <div className="relative size-full">
        <div className="absolute inset-[-24%]">
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
        <div className="absolute inset-0 z-10 flex items-center justify-center text-[#2F4B5D]">
          <div style={{ width: ELLIPSE87_ICON_PX, height: ELLIPSE87_ICON_PX }}>
            <MessageSolidIcon className="size-full shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Home page hero banner — background plate from Figma node 305:2146 (Mask group 1).
 * Texture 1651 × 925 px; overlay scaled from Figma ref 1714 × 924 to match.
 * Large desktop: fluid scale via container `cqw` so the hero fills the shared home content width.
 */
export function HomeBanner() {
  const { t } = useTranslation();

  const heroScale = `scale(calc(100cqw / ${MASK_BG_W}px))`;

  return (
    <section className="relative w-full overflow-x-hidden">
      <div className="w-full [container-type:inline-size]">
        <div
          className="relative w-full overflow-hidden rounded-[36px] shadow-[0_25px_80px_-24px_rgba(15,23,42,0.14)] ring-1 ring-black/[0.06]"
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
                <span className="home-banner-hero-stroke text-[#000]">{ARM.free} </span>
                <span className="home-banner-hero-stroke text-[#FFF]">{ARM.delivery}</span>
              </p>

              <SofaCard />
              <DeliveryCard />
              <ElectronicsCard />

              {/* Promo sub-copy + help CTA; Ellipse 87 to the right of the help button (same row, right-aligned) */}
              <div
                className="absolute z-20 flex flex-col gap-4"
                style={{
                  left: bx(PROMO_COPY_LEFT_REF),
                  right: bx(PROMO_STRIP_RIGHT_REF),
                  top: by(668),
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
                  <HelpPromoEllipse />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

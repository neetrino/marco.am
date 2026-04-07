'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '../lib/i18n-client';

/**
 * Figma MCP asset URLs — valid 7 days from 2026-04-06.
 * Node: 214:1056 · Frame: 1440 × 900 px (right card overflows to ~1714 px).
 */
const ASSETS = {
  bgTexture:     'https://www.figma.com/api/mcp/asset/b54ee867-ba6c-49b4-a7c4-e5ab1f666b4e',
  sofa:          'https://www.figma.com/api/mcp/asset/1a5ccb5d-3c4f-45e8-8489-29d2d9124fd1',
  sofaCircle:    'https://www.figma.com/api/mcp/asset/2f91b1da-a2d5-43d1-b75f-f8c532cd6471',
  truckIcon:     'https://www.figma.com/api/mcp/asset/5249941e-732f-48e2-a3b4-bcadfc9d8ced',
  rightCardBg:   'https://www.figma.com/api/mcp/asset/3f677413-36ef-44bb-a898-711eec0caed7',
  linkIcon1:     'https://www.figma.com/api/mcp/asset/7e5dbdc4-4d4e-47a3-a26b-76000d469a4d',
  linkIcon2:     'https://www.figma.com/api/mcp/asset/01c4ecb0-959a-4403-a191-8d4fe959ea88',
  ellipseCircle: 'https://www.figma.com/api/mcp/asset/d7223cba-07f9-4b3b-b413-ec910607e32f',
  arrow:         'https://www.figma.com/api/mcp/asset/787d7226-c78d-4624-853e-0fd084ba6a51',
  /** BANNER2 1 — Figma node 305:2151, downloaded locally (404×557 px). */
  banner2:       '/images/home-banner-305-2151.png',
} as const;

/**
 * Armenian uppercase text — Unicode escapes keep the source ASCII-safe.
 */
const ARM = {
  gnel:        '\u0533\u0546\u0535\u053c',
  hima:        '\u0540\u053b\u0544\u0531',
  avelin:      '\u0531\u054e\u0535\u053c\u053b\u0546',
  free:        '\u0531\u0546\u054e\u0543\u0531\u054c',
  delivery:    '\u0531\u054c\u0531\u0554\u0578\u0582\u0544',
  nor:         '\u0546\u0548\u054c',
  serndi:      '\u054d\u0535\u054c\u0546\u0534\u053b',
  smartphones: '\u054d\u0544\u0531\u054c\u054f\u0556\u0548\u0546\u0546\u0535\u054c',
  sofaName:    '\u0531\u0576\u056f\u0575\u0578\u0582\u0576\u0561\u0575\u056b\u0576 \u0562\u0561\u0566\u0584\u0578\u0581',
} as const;

const CANVAS_W = 1440;
const CANVAS_H = 900;

/**
 * Left product card — sofa promo with stacked-card depth effect.
 */
function SofaCard() {
  return (
    <>
      {/* Stacked card backgrounds (scaleY-flip creates depth illusion) */}
      <div className="absolute left-[162px] top-[204px] w-[629px] h-[475px] bg-white rounded-[36px] -scale-y-100" />
      <div className="absolute left-[162px] top-[260px] w-[629px] h-[477px] bg-[#c7c7c7] rounded-[36px] -scale-y-100" />
      <div className="absolute left-[162px] top-[323px] w-[631px] h-[481px] bg-[#2f4b5d] rounded-[36px] -scale-y-100" />

      {/* Sofa product image */}
      <div className="absolute left-[194px] top-[100px] w-[563px] h-[563px]">
        <Image src={ASSETS.sofa} alt={ARM.sofaName} fill className="object-contain" unoptimized />
      </div>

      {/* Decorative orbit ring below sofa */}
      <div className="absolute left-[274px] top-[502px] w-[404px] h-[165px]">
        <Image src={ASSETS.sofaCircle} alt="" fill className="object-contain" unoptimized />
      </div>

      {/* Product label */}
      <div className="absolute left-[195px] top-[712px] text-white text-base leading-[1.49]">
        <p>{ARM.sofaName}</p>
        <p>Bellini</p>
      </div>

      <Link
        href="/products"
        className="absolute left-[393px] top-[688px] h-[56px] w-[182px] bg-[#facc15] rounded-[68px] overflow-visible"
      >
        <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 font-bold text-[16px] text-black whitespace-nowrap leading-[24px]">
          {ARM.gnel} {ARM.hima}
        </span>
        <div className="absolute left-[189px] top-[4px] size-[48px]">
          <Image src={ASSETS.ellipseCircle} alt="" fill className="object-contain" unoptimized />
        </div>
        <div className="absolute left-[207px] top-[22px] size-[12px] flex items-center justify-center -rotate-45">
          <Image src={ASSETS.arrow} alt="" width={17} height={8} className="object-contain" unoptimized />
        </div>
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
      <div className="absolute left-[878px] top-[52px] w-[403px] h-[556px] rounded-[36px] overflow-hidden">
        <Image
          src={ASSETS.banner2}
          alt="Անvchair Arakoum"
          fill
          className="object-cover object-center"
          unoptimized
        />
      </div>

      {/* Arrow/link icon — top-right of card */}
      <div className="absolute left-[1194px] top-[52px] w-[87px] h-[87px]">
        <Image src={ASSETS.linkIcon1} alt="" fill className="object-contain" unoptimized />
      </div>
    </>
  );
}

/**
 * Right card — new-arrivals promo (extends ~274 px beyond the 1440 px Figma frame).
 */
function ElectronicsCard() {
  return (
    <>
      {/* Pre-masked dark card background */}
      <div className="absolute left-[1312px] top-[52px] w-[402px] h-[556px]">
        <Image src={ASSETS.rightCardBg} alt="" fill className="object-cover rounded-[36px]" unoptimized />
      </div>

      {/* Discount badge — inside the card, top-left */}
      <p className="absolute left-[1350px] top-[137px] text-[#facc15] text-[78px] leading-[63px] font-black whitespace-nowrap">
        80%
      </p>

      {/* Product image with warm-glow shadow */}
      <div className="absolute left-[1412px] top-[96px] w-[389px] h-[366px] shadow-[0px_0px_25px_0px_rgba(66,50,0,0.8)]">
        <Image src={ASSETS.sofa} alt="Product" fill className="object-cover" unoptimized />
      </div>

      {/* Sub-headline */}
      <div className="absolute left-[1350px] top-[378px] font-black text-[28px] leading-[33px] whitespace-nowrap">
        <p className="text-[#facc15]">{ARM.nor}</p>
        <p className="text-white">{ARM.serndi}</p>
        <p className="text-white">{ARM.smartphones}</p>
      </div>

      {/* White "More" CTA */}
      <Link
        href="/products"
        className="absolute left-[1394px] top-[502px] flex items-center justify-center h-[56px] w-[250px] bg-white text-black rounded-[60px] font-bold text-[16px] overflow-hidden"
      >
        {ARM.avelin}
      </Link>

      {/* Arrow/link icon */}
      <div className="absolute left-[1628px] top-[53px] w-[86px] h-[86px]">
        <Image src={ASSETS.linkIcon2} alt="" fill className="object-contain" unoptimized />
      </div>
    </>
  );
}

/**
 * Home page hero banner — Figma node 214:1056.
 *
 * The Figma artboard is 1440 × 900 px; the right card overflows to ~1714 px.
 * On viewports narrower than 1714 px the right card is partially clipped (by design).
 */
export function HomeBanner() {
  const { t } = useTranslation();

  return (
    <section className="relative w-full overflow-hidden bg-[#facc15]">
      <div className="relative mx-auto h-[900px] w-full max-w-[1714px]">
        {/* Full-bleed background texture */}
        <div className="absolute inset-0">
          <Image src={ASSETS.bgTexture} alt="" fill className="object-cover" priority unoptimized />
        </div>

        {/* Large headline — top-left corner */}
        <p className="absolute left-[121px] top-[88px] whitespace-nowrap font-black text-[60px] leading-[72px]">
          <span className="text-black">{ARM.free} </span>
          <span className="text-white">{ARM.delivery}</span>
        </p>

        <SofaCard />
        <DeliveryCard />
        <ElectronicsCard />

        {/* Promo sub-copy */}
        <p className="absolute left-[622px] right-[325px] top-[656px] text-white text-[24px] leading-[28px] font-semibold">
          {t('home.hero_subtitle')}
        </p>
      </div>
    </section>
  );
}

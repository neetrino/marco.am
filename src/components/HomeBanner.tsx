'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '../lib/i18n-client';

/** Figma MCP asset URLs — valid 7 days from 2026-04-06 */
const ASSETS = {
  bgTexture: 'https://www.figma.com/api/mcp/asset/a664f82e-7fa6-4884-86e2-5ef38c4b1957',
  sofa: 'https://www.figma.com/api/mcp/asset/0c7fa4fe-9ba9-42eb-b27c-67c46518361d',
  sofaCircle: 'https://www.figma.com/api/mcp/asset/6c359abe-46d3-47fb-b50f-2d0282d6dbe4',
  boxesPhoto: 'https://www.figma.com/api/mcp/asset/5df6b654-dd29-45b9-98c2-dc0c20012b6a',
  truckIcon: 'https://www.figma.com/api/mcp/asset/84b8544e-ce1e-49dc-8944-32efb6da0f3c',
  rightCardBg: 'https://www.figma.com/api/mcp/asset/21e1c3b2-d962-4299-bcfd-d4529ca87461',
  linkIcon1: 'https://www.figma.com/api/mcp/asset/df1a9ae4-ae09-4bbe-8671-d7779737eb46',
  linkIcon2: 'https://www.figma.com/api/mcp/asset/cf8028e2-7699-4550-aef0-c8841b25090c',
} as const;

// ── Armenian Unicode literals ──────────────────────────────────────────────
// Rendered via Unicode escapes so the source file stays ASCII-safe.
// Ranges: U+0531–U+054F (Armenian capitals), U+0578/0582 (OU digraph)
const ARM = {
  /** Գnell = Buy (G+N+E+L) */
  gnel: '\u0533\u0545\u0535\u053c',
  /** Hima = Now (H+I+M+A) */
  hima: '\u053e\u053b\u0543\u0531',
  /** Avelin = More (A+V+E+L+I+N) */
  avelin: '\u0531\u054d\u0535\u053c\u053b\u0545',
  /** Anvchaṙ = Free/Gratis (A+N+V+CH+A+R̈) */
  free: '\u0531\u0545\u054d\u0541\u0531\u054b',
  /** Arakoum = Delivery (A+R+A+K+ou+M) */
  delivery: '\u0531\u054b\u0531\u053d\u0578\u0582\u0543',
  /** Nor = New (N+O+R) */
  nor: '\u0545\u0547\u054f',
  /** Serndi = Generation (S+E+R+N+D+I) */
  serndi: '\u054c\u0535\u054f\u0545\u0534\u053b',
  /** Smartfonner = Smartphones */
  smartphones: '\u054c\u0543\u0531\u054f\u0539\u0555\u0547\u0545\u0545\u0535\u054f',
  /** Ankjunain bazmots = Angular sofa */
  sofaName: '\u0531\u0546\u056f\u0575\u0578\u0582\u0576\u0561\u0575\u056b\u0576 \u0562\u0561\u0566\u0574\u0578\u0581',
} as const;

/**
 * Left product card — sofa promo with stacked-card depth effect.
 * All coordinates are relative to the 1440 × 900 px banner canvas.
 */
function SofaCard() {
  return (
    <>
      {/* Stacked card backgrounds — scaleY(-1) peeks from below */}
      <div className="absolute left-[162px] top-[204px] w-[629px] h-[475px] bg-white rounded-[36px] -scale-y-100" />
      <div className="absolute left-[162px] top-[260px] w-[629px] h-[477px] bg-[#c7c7c7] rounded-[36px] -scale-y-100" />
      <div className="absolute left-[162px] top-[323px] w-[631px] h-[481px] bg-[#2f4b5d] rounded-[36px] -scale-y-100" />

      {/* Product image — floats above the card stack */}
      <div className="absolute left-[194px] top-[100px] w-[563px] h-[563px]">
        <Image src={ASSETS.sofa} alt={ARM.sofaName} fill className="object-contain" unoptimized />
      </div>

      {/* Decorative orbit ring */}
      <div className="absolute left-[274px] top-[502px] w-[404px] h-[165px]">
        <Image src={ASSETS.sofaCircle} alt="" fill className="object-contain" unoptimized />
      </div>

      {/* Product label */}
      <div className="absolute left-[195px] top-[712px] text-white text-base leading-[1.49]">
        <p>{ARM.sofaName}</p>
        <p>Bellini</p>
      </div>

      {/* Yellow "Buy now" CTA */}
      <Link
        href="/products"
        className="absolute left-[393px] top-[688px] flex items-center gap-3 h-[56px] px-6 bg-[#facc15] rounded-[68px] font-bold text-[16px] text-black whitespace-nowrap"
      >
        {ARM.gnel} {ARM.hima}
        <span className="flex items-center justify-center size-[48px] rounded-full bg-white/30 text-sm">
          &#8599;
        </span>
      </Link>
    </>
  );
}

/** Middle card — free delivery promo with frosted-glass bottom panel */
function DeliveryCard() {
  return (
    <>
      {/* Background photo clipped to rounded card top */}
      <div className="absolute left-[878px] top-[52px] w-[403px] h-[399px] overflow-hidden rounded-tl-[36px] rounded-tr-[36px]">
        <Image src={ASSETS.boxesPhoto} alt="" fill className="object-cover" unoptimized />
      </div>

      {/* Free-delivery headline */}
      <div className="absolute left-[716px] top-[157px] whitespace-nowrap font-black leading-[43px]">
        <p className="text-[#ffce13] text-[45px]">{ARM.free}</p>
        <p className="text-white text-[45px]">{ARM.delivery}</p>
      </div>

      {/* Delivery truck icon */}
      <div className="absolute left-[955px] top-[290px] w-[100px] h-[96px]">
        <Image src={ASSETS.truckIcon} alt="Free delivery" fill className="object-contain" unoptimized />
      </div>

      {/* Arrow link icon */}
      <div className="absolute left-[1194px] top-[52px] w-[87px] h-[87px]">
        <Image src={ASSETS.linkIcon1} alt="" fill className="object-contain" unoptimized />
      </div>

      {/* Frosted-glass bottom panel */}
      <div className="absolute left-[878px] top-[451px] w-[403px] h-[157px] rounded-bl-[36px] rounded-br-[36px] overflow-hidden backdrop-blur-[5px] bg-[linear-gradient(135.9deg,rgba(255,255,255,0.6)_0%,rgba(153,153,153,0.2)_100%)] flex items-center justify-center">
        <Link
          href="/products"
          className="flex items-center justify-center h-[56px] w-[250px] bg-black text-white rounded-[60px] font-bold text-[16px]"
        >
          {ARM.gnel} {ARM.hima}
        </Link>
      </div>
    </>
  );
}

/** Right card — new-arrivals / electronics promo */
function ElectronicsCard() {
  return (
    <>
      {/* Pre-masked card background */}
      <div className="absolute left-[1312px] top-[52px] w-[402px] h-[556px]">
        <Image src={ASSETS.rightCardBg} alt="" fill className="object-cover rounded-[36px]" unoptimized />
      </div>

      {/* Discount badge */}
      <p className="absolute left-[1012px] top-[125px] text-[#facc15] text-[78px] leading-[63px] font-black whitespace-nowrap">
        80%
      </p>

      {/* Product image with glow shadow */}
      <div className="absolute left-[1172px] top-[96px] w-[389px] h-[366px] shadow-[0px_0px_25px_0px_rgba(66,50,0,0.8)]">
        <Image src={ASSETS.sofa} alt="Product" fill className="object-cover" unoptimized />
      </div>

      {/* Sub-headline */}
      <div className="absolute left-[1012px] top-[366px] font-black text-[28px] leading-[33px] whitespace-nowrap">
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

      {/* Arrow link icon */}
      <div className="absolute left-[1628px] top-[53px] w-[86px] h-[86px]">
        <Image src={ASSETS.linkIcon2} alt="" fill className="object-contain" unoptimized />
      </div>
    </>
  );
}

/**
 * Home page hero banner — Figma node 214:1056.
 * Canvas: 1440 × 900 px; centered and clipped on narrower viewports.
 */
export function HomeBanner() {
  const { t } = useTranslation();

  return (
    <section className="relative w-full overflow-hidden bg-[#facc15]">
      {/* Full-bleed background texture */}
      <div className="absolute inset-0">
        <Image src={ASSETS.bgTexture} alt="" fill className="object-cover" priority unoptimized />
      </div>

      {/* 1440 px content canvas */}
      <div className="relative mx-auto h-[900px] w-full max-w-[1714px]">
        {/* Large headline — top left */}
        <p className="absolute left-[121px] top-[88px] whitespace-nowrap font-black text-[60px] leading-[72px]">
          <span className="text-black">{ARM.free} </span>
          <span className="text-white">{ARM.delivery}</span>
        </p>

        <SofaCard />
        <DeliveryCard />
        <ElectronicsCard />

        {/* Promo sub-copy */}
        <p className="absolute left-[622px] top-[656px] right-[325px] text-white text-[24px] leading-[28px] font-semibold">
          {t('home.hero_subtitle')}
        </p>
      </div>
    </section>
  );
}

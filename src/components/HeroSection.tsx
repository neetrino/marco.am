'use client';

import Image from 'next/image';
import Link from 'next/link';

/** Figma MCP asset URLs (expire in 7 days; replace with project CDN for production). */
const FIGMA_ASSETS = {
  maskGroup1:
    'https://www.figma.com/api/mcp/asset/181303e8-5827-4c86-a6aa-aef7e1da43a3',
  banner1: 'https://www.figma.com/api/mcp/asset/77281017-2b61-4705-9934-f6d975d182ee',
  banner21: 'https://www.figma.com/api/mcp/asset/b7fca506-322d-41e5-b4db-29ec77d87079',
  banner31: 'https://www.figma.com/api/mcp/asset/53e21335-7b2e-482c-bb66-6cba414fd12e',
  group9233: 'https://www.figma.com/api/mcp/asset/19aded66-ce17-47c3-9a3b-ff2d66a8d860',
  ellipse88: 'https://www.figma.com/api/mcp/asset/75898b35-7b52-4718-aa6c-af89d2092824',
  arrow2: 'https://www.figma.com/api/mcp/asset/cf39913e-5bc3-415d-8c5f-71441555833f',
  group9234: 'https://www.figma.com/api/mcp/asset/f9d873be-5c31-4910-ad18-bfec4a907121',
  group9294: 'https://www.figma.com/api/mcp/asset/991cabca-091c-43ee-acf7-a8cf3fb4a475',
} as const;

/** Desktop-only hero section — layout and dimensions from Figma node 305:2163. */
export function HeroSection() {
  return (
    <section
      className="relative w-[1920px] h-[990px] overflow-hidden font-montserrat-arm"
      aria-label="Hero"
      data-name="HERO"
    >
      {/* Background — Mask group 1 */}
      <div
        className="absolute left-[135px] top-[65px] h-[925px] w-[1651px]"
        data-name="Mask group 1"
      >
        <Image
          src={FIGMA_ASSETS.maskGroup1}
          alt=""
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      {/* Left card — BANNER 1 */}
      <div
        className="absolute left-[174px] top-[225px] h-[606px] w-[631px] overflow-hidden"
        data-name="BANNER 1"
      >
        <Image
          src={FIGMA_ASSETS.banner1}
          alt=""
          fill
          className="object-cover object-[0_-16.67%] max-w-none"
          unoptimized
        />
      </div>

      {/* Middle card — BANNER2 */}
      <div className="absolute left-[887px] top-[124px]" data-name="BANNER2">
        <div
          className="absolute left-0 top-0 h-[557px] w-[404px] overflow-hidden"
          data-name="BANNER2 1"
        >
          <Image
            src={FIGMA_ASSETS.banner21}
            alt=""
            fill
            className="object-cover max-w-none"
            unoptimized
          />
        </div>
        <div className="absolute left-[322px] top-0 h-[86.524px] w-[86.924px]">
          <Image
            src={FIGMA_ASSETS.group9233}
            alt=""
            fill
            className="object-contain"
            unoptimized
          />
        </div>
        <Link
          href="/products"
          className="absolute left-[80px] top-[460px] flex h-[56px] w-[250px] items-center justify-center overflow-hidden rounded-full bg-primary text-base font-bold leading-6 text-secondary"
        >
          ԳՆԵԼ ՀԻՄԱ
        </Link>
      </div>

      {/* Main heading */}
      <h1
        className="absolute left-[10.78%] right-[55.63%] top-[calc(50%-407.5px)] font-montserrat-arm text-[60px] font-black leading-[72px] tracking-tight text-white whitespace-nowrap"
      >
        <span className="text-primary">ԱՆՎՃԱՐ </span>
        <span>ԱՌԱՔՈՒՄ</span>
      </h1>

      {/* Promo text */}
      <p
        className="absolute left-[46.3%] right-[19.48%] top-[calc(50%+201.5px)] font-montserrat-arm text-2xl font-semibold leading-7 text-secondary"
      >
        Զգացեք տեխնոլոգիայի հզորությունը: Ստացեք մինչև 20% զեղչ այսօրվա
        նախնական պատվերների համար:
      </p>

      {/* CTA button — gold pill with arrow */}
      <Link
        href="/products"
        className="absolute left-[27.76%] right-[59.58%] top-[calc(50%+233.5px)] flex h-[56px] -translate-y-1/2 items-center justify-center gap-0 rounded-full bg-gold px-6 text-base font-bold leading-6 text-primary"
      >
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap">
          ԳՆԵԼ ՀԻՄԱ
        </span>
        <span className="absolute left-[189px] top-[4px] h-12 w-12">
          <Image
            src={FIGMA_ASSETS.ellipse88}
            alt=""
            fill
            className="object-contain"
            unoptimized
          />
        </span>
        <span className="absolute left-[207px] top-[22px] h-[11.769px] w-[16.643px] -rotate-45">
          <Image
            src={FIGMA_ASSETS.arrow2}
            alt=""
            fill
            className="object-contain"
            unoptimized
          />
        </span>
      </Link>

      {/* Product label under left card */}
      <div className="absolute left-[198px] top-[758.75px] flex h-[59.505px] w-[224.383px] flex-col justify-center font-montserrat-arm text-base leading-[23.8px] text-secondary">
        <p className="m-0">Անկյունային բազմոց</p>
        <p>Беллини</p>
      </div>

      {/* Right card — BANNER3 */}
      <div className="absolute left-[1326px] top-[124px]" data-name="BANNER3">
        <div
          className="absolute left-0 top-0 h-[557px] w-[516px] overflow-hidden"
          data-name="BANNER3 1"
        >
          <Image
            src={FIGMA_ASSETS.banner31}
            alt=""
            fill
            className="object-cover max-w-none"
            unoptimized
          />
        </div>
        <div className="absolute left-[323px] top-0 h-[86px] w-[86px]">
          <Image
            src={FIGMA_ASSETS.group9234}
            alt=""
            fill
            className="object-contain"
            unoptimized
          />
        </div>
        <Link
          href="/products"
          className="absolute left-[83px] top-[461px] flex h-[56px] w-[250px] items-center justify-center overflow-hidden rounded-full bg-secondary text-base font-bold leading-6 text-primary"
        >
          ԱՎԵԼԻՆ
        </Link>
      </div>

      {/* Help block — button + chat icon */}
      <div className="absolute left-[1311px] top-[843px] h-[100px] w-[424px]">
        <Link
          href="/contact"
          className="absolute left-0 top-[17.5px] flex h-[56px] w-[250px] -translate-y-1/2 items-center justify-center rounded-full bg-hero-blue px-6 text-base font-bold leading-6 text-secondary shadow-chat"
        >
          Ինչո՞վ կարող ենք ձեզ օգնել
        </Link>
        <div className="absolute left-[324px] top-0 h-[100px] w-[100px]">
          <Image
            src={FIGMA_ASSETS.group9294}
            alt=""
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      </div>
    </section>
  );
}

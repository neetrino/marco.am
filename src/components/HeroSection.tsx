'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '../lib/i18n-client';

/** Figma node 305:2163 — asset URLs from get_design_context (refresh via MCP if expired). */
const FIGMA_ASSETS = {
  maskGroup1:
    'https://www.figma.com/api/mcp/asset/ebc57c18-24af-4520-95bd-ab605e37c4dc',
  banner1: 'https://www.figma.com/api/mcp/asset/e1b284c6-89f6-4972-b288-b229ac81caff',
  banner21: 'https://www.figma.com/api/mcp/asset/37d73f28-c5ba-47a4-821c-01c26bdf0736',
  banner31: 'https://www.figma.com/api/mcp/asset/cd481aa5-6fec-48fc-ab88-60f8ebaf1ee1',
  group9233: 'https://www.figma.com/api/mcp/asset/4be5b83a-7676-424e-bd45-f3f7adbdf901',
  ellipse88: 'https://www.figma.com/api/mcp/asset/4cb84c0c-23ec-4e48-ae5f-b7bffe68710d',
  arrow2: 'https://www.figma.com/api/mcp/asset/e43f182d-8a68-4b14-b836-956dc65637ca',
  group9234: 'https://www.figma.com/api/mcp/asset/a3a53725-89fa-4777-b46f-3919125fba1b',
  group9294: 'https://www.figma.com/api/mcp/asset/7d183560-6162-48ae-bb0a-f9c988a64952',
} as const;

/**
 * HERO — Figma MARCO node 305:2163 (inside MARCO HOME 101:2781).
 * Fixed 1920×1055 layout; parent should use overflow-x-auto on narrow viewports.
 */
export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section
      className="relative h-[1055px] w-[1920px] max-w-none shrink-0 overflow-hidden font-montserrat-arm"
      aria-label="Hero"
      data-name="HERO"
      data-node-id="305:2163"
    >
      {/* Background — Mask group 1 */}
      <div
        className="absolute left-[135px] top-[65px] h-[925px] w-[1651px]"
        data-name="Mask group 1"
        data-node-id="305:2146"
      >
        <Image
          src={FIGMA_ASSETS.maskGroup1}
          alt=""
          fill
          className="pointer-events-none object-cover"
          sizes="1651px"
          unoptimized
        />
      </div>

      {/* Left card — BANNER 1 */}
      <div
        className="absolute left-[174px] top-[225px] h-[606px] w-[631px] overflow-hidden"
        data-name="BANNER 1"
        data-node-id="305:2147"
      >
        <Image
          src={FIGMA_ASSETS.banner1}
          alt=""
          fill
          className="max-w-none object-cover object-[0_-16.67%]"
          sizes="631px"
          unoptimized
        />
      </div>

      {/* Middle card — BANNER2 */}
      <div className="absolute left-[887px] top-[124px]" data-name="BANNER2" data-node-id="305:2161">
        <div
          className="absolute left-0 top-0 h-[557px] w-[404px] overflow-hidden"
          data-name="BANNER2 1"
          data-node-id="305:2151"
        >
          <Image
            src={FIGMA_ASSETS.banner21}
            alt=""
            fill
            className="max-w-none object-cover"
            sizes="404px"
            unoptimized
          />
        </div>
        <div className="absolute left-[322px] top-0 h-[86.524px] w-[86.924px]" data-node-id="305:2115">
          <Image
            src={FIGMA_ASSETS.group9233}
            alt=""
            fill
            className="object-contain"
            sizes="87px"
            unoptimized
          />
        </div>
        <Link
          href="/products"
          className="absolute left-[80px] top-[460px] flex h-[56px] w-[250px] items-center justify-center overflow-hidden rounded-[60px] bg-black text-base font-bold leading-6 text-white hover:opacity-90"
          data-node-id="305:2110"
        >
          {t('home.hero_buy_now')}
        </Link>
      </div>

      {/* Заголовок — Figma 305:2142 */}
      <h1
        className="absolute left-[207px] top-[120px] max-w-[645px] font-montserrat-arm text-[60px] font-black leading-[72px] tracking-tight text-white"
        data-node-id="305:2142"
      >
        {t('home.hero_heading_line')}
      </h1>

      {/* Промо — Figma 305:2141 */}
      <p
        className="absolute left-[889px] top-[729px] w-[657px] font-montserrat-arm text-2xl font-semibold leading-7 text-white"
        data-node-id="305:2141"
      >
        {t('home.hero_promo_text')}
      </p>

      {/* CTA — Figma 305:2096 */}
      <Link
        href="/products"
        className="absolute left-[533px] top-[733px] flex h-[56px] w-[243px] items-center justify-center rounded-[68px] bg-[#facc15] text-base font-bold leading-6 text-black hover:opacity-90"
        data-node-id="305:2096"
      >
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap">
          {t('home.hero_buy_now')}
        </span>
        <span className="absolute left-[189px] top-1 h-12 w-12">
          <Image
            src={FIGMA_ASSETS.ellipse88}
            alt=""
            fill
            className="object-contain"
            sizes="48px"
            unoptimized
          />
        </span>
        <span className="absolute left-[207px] top-[22px] h-[11.769px] w-[16.643px] -rotate-45">
          <Image
            src={FIGMA_ASSETS.arrow2}
            alt=""
            fill
            className="object-contain"
            sizes="17px"
            unoptimized
          />
        </span>
      </Link>

      {/* Product labels — left card */}
      <div
        className="absolute left-[198px] top-[758.75px] flex h-[59.505px] w-[224.383px] -translate-y-1/2 flex-col justify-center font-montserrat-arm text-base leading-[23.8px] text-white"
        data-node-id="305:2148"
      >
        <p className="m-0 leading-[23.8px]">{t('home.hero_product_sofa_title')}</p>
        <p className="leading-[23.8px]">{t('home.hero_product_sofa_brand')}</p>
      </div>

      {/* Right card — BANNER3 */}
      <div className="absolute left-[1326px] top-[124px]" data-name="BANNER3" data-node-id="305:2162">
        <div
          className="absolute left-0 top-0 h-[557px] w-[516px] overflow-hidden"
          data-name="BANNER3 1"
          data-node-id="305:2154"
        >
          <Image
            src={FIGMA_ASSETS.banner31}
            alt=""
            fill
            className="pointer-events-none object-cover"
            sizes="516px"
            unoptimized
          />
        </div>
        <div className="absolute left-[323px] top-0 h-[86px] w-[86px]" data-node-id="305:2131">
          <Image
            src={FIGMA_ASSETS.group9234}
            alt=""
            fill
            className="object-contain"
            sizes="86px"
            unoptimized
          />
        </div>
        <Link
          href="/products"
          className="absolute left-[83px] top-[461px] flex h-[56px] w-[250px] items-center justify-center overflow-hidden rounded-[60px] bg-white text-base font-bold leading-6 text-black hover:opacity-90"
          data-node-id="305:2159"
        >
          {t('home.hero_more')}
        </Link>
      </div>

      {/* Help — pill + chat (Figma 101:4067) */}
      <div className="absolute contents left-[1311px] top-[843px]" data-node-id="101:4067">
        <Link
          href="/contact"
          className="-translate-y-1/2 absolute left-[68.28%] right-[15.52%] top-[calc(50%+365.5px)] flex h-[56px] items-center justify-center rounded-[68px] bg-[#2f4b5d] px-4 text-base font-bold leading-6 text-white shadow-[0px_4px_24px_0px_rgba(150,150,150,0.28)] hover:opacity-95"
          data-node-id="101:4068"
        >
          <span className="whitespace-nowrap">{t('home.hero_help_button')}</span>
        </Link>
        <Link
          href="/contact"
          className="absolute left-[1635px] top-[843px] h-[100px] w-[100px]"
          aria-label="Chat"
          data-node-id="270:2277"
        >
          <span className="absolute inset-[-24%] block">
            <Image
              src={FIGMA_ASSETS.group9294}
              alt=""
              fill
              className="object-contain"
              sizes="100px"
              unoptimized
            />
          </span>
        </Link>
      </div>
    </section>
  );
}

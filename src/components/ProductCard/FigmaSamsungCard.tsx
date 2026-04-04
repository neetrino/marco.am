'use client';

import Link from 'next/link';
import Image from 'next/image';

/** Figma MCP URLs — node 101:3557 Galaxy S24 Ultra card */
const SAMSUNG_FIGMA_URLS = {
  samsungPhone:
    'https://www.figma.com/api/mcp/asset/f6ef0d32-5747-48f0-87a4-6e6dea779259',
  starLg: 'https://www.figma.com/api/mcp/asset/9acaad66-d735-4630-a4e2-d350edc4a348',
  starHalf: 'https://www.figma.com/api/mcp/asset/1b54396d-83e3-487a-a86e-cdb8f5be4fd9',
  wishlistBtn:
    'https://www.figma.com/api/mcp/asset/1f8b234d-d4ee-462b-ae1c-6e9ca36a561c',
  compareLg:
    'https://www.figma.com/api/mcp/asset/06d42a9f-c91b-4a2a-ad87-97eddb7cc9b8',
  dotGray:
    'https://www.figma.com/api/mcp/asset/0d8a6cc5-b50a-4e76-b7af-dfae892664b5',
  dotYellow:
    'https://www.figma.com/api/mcp/asset/30379ded-c407-4497-a934-297a2198faac',
  samsungHalo:
    'https://www.figma.com/api/mcp/asset/ed9a5f3a-f49a-41c1-8fe3-d36490c30ef6',
  samsungCart:
    'https://www.figma.com/api/mcp/asset/6b9b8f4b-d284-40e7-8062-6342e6524f64',
} as const;

/** Figma Product1 — node 101:3557 */
export function FigmaSamsungCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`font-montserrat-arm absolute top-0 h-[486px] w-[306.418px] ${className}`}
      data-node-id="101:3557"
    >
      <div className="absolute inset-0 rounded-[32px] bg-[#f6f6f6]">
        <div className="absolute left-2 top-4 z-10 h-[43px] w-[81px] rounded-[16px] bg-[#1e1e1e]">
          <p className="absolute left-[14.81%] right-[14.81%] top-2 whitespace-nowrap text-[14px] font-bold text-[#ffca03]">
            3 ՏԱՐԻ
          </p>
          <p className="absolute left-[11.11%] right-[11.11%] top-[22px] text-[11px] font-bold text-white">
            ԵՐԱՇԽԻՔ
          </p>
        </div>

        <div className="absolute right-0 top-[129px] z-10 flex h-[23px] min-w-[52px] items-center justify-center rounded-[24px] bg-[#ffca03] px-2">
          <span className="text-[10px] font-bold text-white">-15%</span>
        </div>
        <div className="absolute right-0 top-[17px] z-10 size-8">
          <Image
            src={SAMSUNG_FIGMA_URLS.wishlistBtn}
            alt=""
            width={32}
            height={32}
            className="size-full"
            unoptimized
          />
        </div>
        <div className="absolute right-0 top-[72px] z-10 size-8 rounded-full bg-black">
          <div className="absolute inset-[27.08%_30.09%_27.08%_29.17%]">
            <div className="relative h-full w-full">
              <Image
                src={SAMSUNG_FIGMA_URLS.compareLg}
                alt=""
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>

        <div className="absolute left-[11.1%] right-[9.6%] top-[32px] h-[244px] mix-blend-multiply">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <Image
              src={SAMSUNG_FIGMA_URLS.samsungPhone}
              alt=""
              fill
              className="object-contain"
              sizes="280px"
              unoptimized
            />
          </div>
        </div>

        <div className="absolute left-[6.03%] right-[6.03%] top-[281px] min-h-[132px]">
          <div className="relative">
            <p className="absolute left-0 top-1 text-[12px] font-black uppercase leading-4 tracking-[0.6px] text-[#354ae6]">
              Samsung
            </p>
            <div className="absolute left-[115px] top-[9px] flex gap-[15px]">
              <Image
                src={SAMSUNG_FIGMA_URLS.dotGray}
                alt=""
                width={11}
                height={11}
                unoptimized
              />
              <Image
                src={SAMSUNG_FIGMA_URLS.dotYellow}
                alt=""
                width={11}
                height={11}
                unoptimized
              />
            </div>
          </div>
          <div className="absolute left-0 right-0 top-6 min-h-10">
            <Link href="/products/galaxy-s24-ultra">
              <p className="pt-0.5 text-[16px] font-bold leading-5 text-[#181111]">
                <span>Galaxy S24 Ultra 256GB </span>
                <span className="font-normal">Titanium Gray</span>
              </p>
            </Link>
          </div>
          <div className="absolute left-0 right-0 top-[81px] flex h-4 items-center gap-1">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="relative h-[13px] w-[13px] shrink-0">
                <Image
                  src={SAMSUNG_FIGMA_URLS.starLg}
                  alt=""
                  width={13}
                  height={13}
                  className="object-contain"
                  unoptimized
                />
              </div>
            ))}
            <div className="relative h-[13px] w-[13px] shrink-0">
              <Image
                src={SAMSUNG_FIGMA_URLS.starHalf}
                alt=""
                width={13}
                height={13}
                className="object-contain"
                unoptimized
              />
            </div>
            <span className="pl-1 text-[14px] font-normal leading-[15px] text-[#9ca3af]">
              (42)
            </span>
          </div>
          <p className="absolute left-0 top-[108px] text-[20px] font-black leading-7 text-[#181111]">
            549,000 ֏
          </p>
        </div>

        <div className="absolute left-[244px] top-[419px] size-[62px]">
          <div className="absolute inset-[-33.87%]">
            <Image
              src={SAMSUNG_FIGMA_URLS.samsungHalo}
              alt=""
              width={84}
              height={84}
              className="size-full max-w-none"
              unoptimized
            />
          </div>
        </div>
        <div className="pointer-events-none absolute left-[263px] top-[432px] h-[26px] w-[25px]">
          <Image
            src={SAMSUNG_FIGMA_URLS.samsungCart}
            alt=""
            width={25}
            height={26}
            className="size-full"
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}

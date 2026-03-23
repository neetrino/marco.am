'use client';

/**
 * MARCO HEADER — pixel-perfect implementation from Figma (node 242:1773).
 * Exact spacing, typography, and colors from design.
 */

import Image from 'next/image';
import Link from 'next/link';

/* Figma asset URL for logo (expires in 7 days; replace with local asset for production) */
const LOGO_SRC =
  'https://www.figma.com/api/mcp/asset/351a3b04-df13-4396-a6c5-71ab6c5a64bb';

/* Icons as inline SVGs to preserve pixel-perfect look and avoid external asset expiry */
function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M3 4.5L6 7.5L9 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon24() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle
        cx="10"
        cy="10"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
      />
      <path
        d="M15.5 15.5L19 19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 19 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M16.5 12.5v1.75a1.75 1.75 0 01-1.75 1.75h-2.25a13.5 13.5 0 01-9.5-9.5H2.25A1.75 1.75 0 014 4.5v2.25c0 .465.252.893.66 1.123l4.423 1.106c.44.11.902-.055 1.173-.417l.97-1.293c.282-.376.769-.542 1.21-.38a12.035 12.035 0 017.143 7.143c.162.441-.004.928-.38 1.21l-1.293.97c-.363.271-.527.734-.417 1.173L16.4 11.84c.23.408.66.66 1.1.66z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg
      width="15"
      height="19"
      viewBox="0 0 15 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M7.5 0C3.36 0 0 3.36 0 7.5c0 5.625 7.5 11.5 7.5 11.5s7.5-5.875 7.5-11.5C15 3.36 11.64 0 7.5 0zm0 10.125a2.625 2.625 0 110-5.25 2.625 2.625 0 010 5.25z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle
        cx="9"
        cy="9"
        r="7"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M2 9h14M9 2a12.2 12.2 0 012 7 12.2 12.2 0 01-2 7 12.2 12.2 0 01-2-7 12.2 12.2 0 012-7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      width="22"
      height="21"
      viewBox="0 0 22 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M7 7V5a3 3 0 016 0v2m-6 0h10l-1 10H8L7 7z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const NAV_LINKS = [
  { href: '/', label: 'Գլխավոր' },
  { href: '/about', label: 'Մեր մասին' },
  { href: '/products', label: 'Խանութ' },
  { href: '/brands', label: 'Բրենդներ' },
  { href: '/contact', label: 'Կապ մեզ հետ' },
  { href: '/reels', label: 'reels' },
] as const;

export function MarcoHeader({ className }: { className?: string }) {
  return (
    <header
      className={`flex flex-col items-stretch w-full ${className ?? ''}`}
      data-name="HEADER"
      data-figma-node-id="242:1773"
    >
      {/* Top bar: logo, nav, social, phone, addresses */}
      <div
        className="bg-white border border-[#ebebeb] border-solid flex flex-col shrink-0 w-full"
        style={{ padding: '6px 151px' }}
      >
        <div className="flex gap-[54px] items-center shrink-0">
          {/* Logo — Figma: 83×73 */}
          <Link href="/" className="relative shrink-0 w-[83px] h-[73px] block">
            <Image
              src={LOGO_SRC}
              alt="MARCO"
              width={83}
              height={73}
              className="object-contain object-left"
              unoptimized
            />
          </Link>

          {/* Main nav — gap 45px, 16px, leading 18px */}
          <nav
            className="capitalize flex font-bold gap-[45px] items-center leading-[18px] shrink-0 text-[16px] text-[#333333] whitespace-nowrap font-montserrat-arm"
            aria-label="Main navigation"
          >
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col justify-center shrink-0 hover:text-[#101010] transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Social + contact block — gap 16px between icon buttons */}
          <div className="flex gap-[16px] items-center shrink-0 ml-auto">
            <a
              href="#"
              className="w-10 h-10 rounded-full border border-[#ebebeb] flex items-center justify-center hover:bg-[#101010] hover:text-white hover:border-[#101010] transition-colors text-[#333]"
              aria-label="Instagram"
            >
              <span className="text-[10px] font-bold">IG</span>
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full border border-[#ebebeb] flex items-center justify-center hover:bg-[#101010] hover:text-white hover:border-[#101010] transition-colors text-[#333]"
              aria-label="Facebook"
            >
              <span className="text-[10px] font-bold">FB</span>
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full border border-[#ebebeb] flex items-center justify-center hover:bg-[#101010] hover:text-white hover:border-[#101010] transition-colors text-[#333]"
              aria-label="Telegram"
            >
              <span className="text-[10px] font-bold">TG</span>
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full border border-[#ebebeb] flex items-center justify-center hover:bg-[#101010] hover:text-white hover:border-[#101010] transition-colors text-[#333]"
              aria-label="WhatsApp"
            >
              <span className="text-[10px] font-bold">WA</span>
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-[#f4f4f4] flex items-center justify-center hover:bg-[#101010] hover:text-white transition-colors text-[#333]"
              aria-label="More"
            >
              <span className="text-[10px] font-bold">+</span>
            </a>
          </div>

          {/* Phone + Addresses — gap 29px between the two groups */}
          <div className="flex gap-[29px] items-center shrink-0">
            <a
              href="tel:+37460500406"
              className="flex items-center gap-[25px] text-[#333] font-medium text-[18px] leading-[18px] font-montserrat-arm"
            >
              <PhoneIcon />
              <span>+374 60 50 04 06</span>
              <ChevronDownIcon className="text-[#333] shrink-0" />
            </a>
            <Link
              href="/contact#addresses"
              className="flex items-center gap-[20px] text-[#333] font-medium text-[16px] leading-[18px] font-montserrat-arm"
            >
              <MapPinIcon />
              <span>Հասցեներ</span>
              <ChevronDownIcon className="text-[#333] shrink-0" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom bar: categories, search, lang, icons, cart */}
      <div
        className="bg-white flex flex-col shrink-0 w-full"
        style={{ padding: '14px 150px' }}
      >
        <div className="flex gap-[66px] items-center w-full">
          {/* Left: Categories + Search — gap 25px */}
          <div className="flex flex-1 gap-[25px] items-start min-w-0">
            {/* Categories button — 251×54, #101010, pill shape */}
            <div className="relative shrink-0 flex items-center gap-[42px]">
              <button
                type="button"
                className="h-[54px] w-[251px] rounded-[30px] rounded-br-[89px] rounded-tr-[89px] bg-[#101010] flex items-center justify-center gap-2 text-white text-[16px] leading-[24px] font-normal font-montserrat-arm hover:bg-[#333] transition-colors"
                aria-haspopup="listbox"
                aria-expanded={false}
              >
                Կատեգորիաներ
                <ChevronDownIcon className="text-white" />
              </button>
            </div>

            {/* Search — 700×56, #f4f4f4, search button 155×54 #ffca03 */}
            <form
              className="relative h-[56px] w-[700px] max-w-full rounded-[200px] bg-[#f4f4f4] flex items-center overflow-hidden shrink-0"
              onSubmit={(e) => e.preventDefault()}
              role="search"
            >
              <div className="flex gap-[8px] items-center pl-[24px] pr-[155px] py-[16px] flex-1 min-w-0">
                <span className="text-[#212b36]/[0.46] shrink-0" aria-hidden>
                  <SearchIcon24 />
                </span>
                <input
                  type="search"
                  placeholder="Որոնել"
                  className="flex-1 min-w-0 bg-transparent border-0 text-[14px] leading-normal text-[#212b36] placeholder:text-[#212b36]/[0.46] font-montserrat-arm outline-none"
                  aria-label="Որոնել"
                />
              </div>
              <button
                type="submit"
                className="absolute right-0 top-0 h-[54px] w-[155px] rounded-bl-[30px] rounded-br-[89px] rounded-tl-[30px] rounded-tr-[89px] bg-[#ffca03] flex items-center justify-center text-[#101010] text-[14px] font-semibold font-montserrat-arm hover:bg-[#e6b602] transition-colors shrink-0"
              >
                Որոնել
              </button>
            </form>
          </div>

          {/* Right: Lang, icons, cart — gap 23px */}
          <div className="flex gap-[23px] items-center shrink-0">
            {/* Language/currency — 212×48, #f4f4f4, rounded 80px */}
            <button
              type="button"
              className="h-[48px] w-[212px] rounded-[80px] bg-[#f4f4f4] flex items-center justify-center gap-2 text-[#333] text-[16px] leading-[18px] font-bold font-montserrat-arm hover:bg-[#ebebeb] transition-colors"
              aria-haspopup="listbox"
              aria-expanded={false}
            >
              <GlobeIcon />
              <span>ENG /</span>
              <span>AMD</span>
              <ChevronDownIcon className="text-[#333]" />
            </button>

            {/* Icon buttons 48×48 */}
            <button
              type="button"
              className="w-12 h-12 rounded-full flex items-center justify-center text-[#333] hover:bg-[#f4f4f4] transition-colors"
              aria-label="Settings"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <Link
              href="/profile"
              className="w-12 h-12 rounded-full flex items-center justify-center text-[#333] hover:bg-[#f4f4f4] transition-colors"
              aria-label="Profile"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="8" r="3.2" />
                <path strokeLinecap="round" d="M6 20c0-3.5 2.5-5.5 6-5.5s6 2 6 5.5" />
              </svg>
            </Link>
            <Link
              href="/compare"
              className="w-12 h-12 rounded-full flex items-center justify-center text-[#333] hover:bg-[#f4f4f4] transition-colors"
              aria-label="Compare"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l4-4" />
              </svg>
            </Link>
            <Link
              href="/wishlist"
              className="w-12 h-12 rounded-full flex items-center justify-center text-[#333] hover:bg-[#f4f4f4] transition-colors"
              aria-label="Wishlist"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>

            {/* Cart — 122×48, #000 */}
            <Link
              href="/cart"
              className="h-[48px] w-[122px] rounded-[68px] bg-[#101010] flex items-center justify-center gap-[11px] text-white text-[16px] leading-[24px] font-bold font-montserrat-arm hover:bg-[#333] transition-colors shrink-0 px-[25px]"
            >
              <CartIcon />
              <span>0.00</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

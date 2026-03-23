'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { BRAND_NAME } from './headerConfig';
import { NavLinks } from './NavLinks';

type TFunction = (key: string) => string;

interface HeaderTopNavProps {
  t: TFunction;
  phoneDisplay: string;
  instagramUrl?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  languageSwitcher: ReactNode;
  locationDropdown: ReactNode;
  /** Optional: custom logo node (e.g. Image). If not provided, brand name is used. */
  logo?: ReactNode;
}

export function HeaderTopNav({
  t,
  phoneDisplay,
  instagramUrl = '#',
  facebookUrl = '#',
  linkedinUrl = '#',
  languageSwitcher,
  locationDropdown,
  logo,
}: HeaderTopNavProps) {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Logo + Nav (center on desktop) */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8 sm:flex-1 sm:justify-center">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              {logo ?? (
                <span className="text-xl font-semibold text-gray-900 tracking-tight">{BRAND_NAME}</span>
              )}
            </Link>
            <div className="hidden md:block">
              <NavLinks
                t={t}
                linkClassName="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
              />
            </div>
          </div>

          {/* Right: Social, phone, location, language */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-end">
            <div className="flex items-center gap-3 text-gray-600">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-full hover:bg-gray-100 hover:text-gray-900 transition-colors"
                aria-label={t('common.ariaLabels.instagram')}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-full hover:bg-gray-100 hover:text-gray-900 transition-colors"
                aria-label={t('common.ariaLabels.facebook')}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-full hover:bg-gray-100 hover:text-gray-900 transition-colors"
                aria-label={t('common.ariaLabels.linkedin')}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
            <a
              href={`tel:${phoneDisplay.replace(/\s/g, '')}`}
              className="flex items-center gap-2 text-gray-700 font-medium hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              {phoneDisplay}
            </a>
            {locationDropdown}
            {languageSwitcher}
          </div>
        </div>
      </div>
    </div>
  );
}

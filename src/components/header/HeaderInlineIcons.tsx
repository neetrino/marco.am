'use client';

import type { ReactNode } from 'react';
import { HeaderNavbarProfileIcon } from '../icons/HeaderNavbarProfileIcon';

/** Categories dropdown chevron */
export function HeaderChevronDownIcon() {
  return (
    <svg
      className="shrink-0"
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const HEADER_PROFILE_ICON_CLASS = 'h-[16px] w-[15px] shrink-0';

export function HeaderProfileIconOutline() {
  return <HeaderNavbarProfileIcon className={HEADER_PROFILE_ICON_CLASS} />;
}

export function HeaderProfileIconFilled() {
  return (
    <div className="relative flex h-[16px] w-[16px] items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 opacity-90 shadow-md transition-opacity duration-200 group-hover:opacity-100" />
      <HeaderNavbarProfileIcon className={`relative z-10 text-white ${HEADER_PROFILE_ICON_CLASS}`} />
    </div>
  );
}

export function HeaderSearchGlyph() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      width="16"
      height="16"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="M15.5 15.5L19 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

interface BadgeIconProps {
  icon: ReactNode;
  badge?: number;
  className?: string;
  iconClassName?: string;
}

export function HeaderBadgeIcon({ icon, badge = 0, className = '', iconClassName = '' }: BadgeIconProps) {
  return (
    <div className={`relative ${className}`}>
      <div className={iconClassName}>{icon}</div>
      {badge > 0 && (
        <span
          className="
      absolute
      -top-5
      -right-5
      bg-gradient-to-br from-red-500 to-red-600
      text-white text-[10px] font-bold
      rounded-full min-w-[20px] h-5 px-1.5
      flex items-center justify-center
      leading-none shadow-lg border-2 border-white
      animate-pulse
    "
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </div>
  );
}

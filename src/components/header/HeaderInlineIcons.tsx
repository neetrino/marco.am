'use client';

import type { ReactNode } from 'react';
import { HeaderNavbarProfileIcon } from '../icons/HeaderNavbarProfileIcon';

/** Categories dropdown chevron — larger on wide desktop (nudged left); stroke stays thin, not bold. */
export function HeaderChevronDownIcon() {
  return (
    <svg
      className="h-2.5 w-2.5 shrink-0 min-[1367px]:-ml-2 min-[1367px]:h-5 min-[1367px]:w-5"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3 4.5L6 7.5L9 4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="[stroke-width:1.5px] min-[1367px]:[stroke-width:1.1px]"
      />
    </svg>
  );
}

const HEADER_PROFILE_ICON_CLASS = 'h-[16px] w-[15px] shrink-0';

export function HeaderProfileIconOutline() {
  return <HeaderNavbarProfileIcon className={HEADER_PROFILE_ICON_CLASS} />;
}

export function HeaderProfileIconFilled() {
  return (
    <HeaderNavbarProfileIcon className={`text-marco-black ${HEADER_PROFILE_ICON_CLASS}`} />
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
      -top-[13px]
      -right-[13px]
      bg-red-600
      text-white text-[9px] font-bold
      rounded-full min-w-[18px] h-4 px-0.5
      flex items-center justify-center
      leading-none
    "
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </div>
  );
}

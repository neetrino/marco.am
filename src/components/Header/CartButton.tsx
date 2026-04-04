'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

interface CartButtonProps {
  totalFormatted: string;
  icon: ReactNode;
  badge?: number;
  className?: string;
}

export function CartButton({ totalFormatted, icon, badge = 0, className = '' }: CartButtonProps) {
  return (
    <Link
      href="/cart"
      className={
        className ||
        'flex items-center gap-2 h-11 pl-4 pr-5 rounded-full bg-black text-white font-semibold text-sm hover:bg-gray-800 transition-colors shrink-0'
      }
      aria-label="Cart"
    >
      <span className="relative inline-flex items-center justify-center w-5 h-5 text-white">
        {icon}
        {badge > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
            aria-hidden
          >
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      <span>{totalFormatted}</span>
    </Link>
  );
}

'use client';

import type { CSSProperties } from 'react';

/**
 * Figma MARCO file node `101:3596` — compare / exchange glyph (white on dark).
 */
const COMPARE_ICON_VIEWBOX_W = 21.3556;
const COMPARE_ICON_VIEWBOX_H = 23.8;

interface CompareIconProps {
  /**
   * Reference width in px; height follows Figma aspect ratio.
   */
  size?: number;
  /**
   * Stroke width for paths (Figma default 1.8 at export scale).
   */
  strokeWidth?: number;
  /**
   * Tailwind / utility classes — use `text-white` on dark buttons.
   */
  className?: string;
  style?: CSSProperties;
  color?: string;
  /**
   * Active state (optional visual hook for callers).
   */
  isActive?: boolean;
}

/**
 * Compare icon matching Figma special-offer action (replaces legacy Shuffle).
 */
export function CompareIcon({
  size = 18,
  strokeWidth = 1.8,
  className = '',
  style,
  color,
  isActive = false,
}: CompareIconProps) {
  void isActive;
  const heightPx = (size * COMPARE_ICON_VIEWBOX_H) / COMPARE_ICON_VIEWBOX_W;

  return (
    <svg
      width={size}
      height={heightPx}
      viewBox={`0 0 ${COMPARE_ICON_VIEWBOX_W} ${COMPARE_ICON_VIEWBOX_H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className || undefined}
      style={style}
      aria-hidden
    >
      <g>
        <path
          d="M0.9 4.56667C0.9 5.21497 1.15754 5.83673 1.61596 6.29515C2.07438 6.75357 2.69614 7.01111 3.34444 7.01111C3.99275 7.01111 4.61451 6.75357 5.07293 6.29515C5.53135 5.83673 5.78889 5.21497 5.78889 4.56667C5.78889 3.91836 5.53135 3.29661 5.07293 2.83818C4.61451 2.37976 3.99275 2.12222 3.34444 2.12222C2.69614 2.12222 2.07438 2.37976 1.61596 2.83818C1.15754 3.29661 0.9 3.91836 0.9 4.56667ZM15.5667 19.2333C15.5667 19.8816 15.8242 20.5034 16.2826 20.9618C16.7411 21.4202 17.3628 21.6778 18.0111 21.6778C18.6594 21.6778 19.2812 21.4202 19.7396 20.9618C20.198 20.5034 20.4556 19.8816 20.4556 19.2333C20.4556 18.585 20.198 17.9633 19.7396 17.5049C19.2812 17.0464 18.6594 16.7889 18.0111 16.7889C17.3628 16.7889 16.7411 17.0464 16.2826 17.5049C15.8242 17.9633 15.5667 18.585 15.5667 19.2333Z"
          stroke={color ?? 'currentColor'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.45556 4.56667H15.5667C16.215 4.56667 16.8367 4.82421 17.2951 5.28263C17.7536 5.74105 18.0111 6.3628 18.0111 7.01111V16.7889"
          stroke={color ?? 'currentColor'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.1222 8.23333L9.45556 4.56667L13.1222 0.9M11.9 19.2333H5.78889C5.14058 19.2333 4.51883 18.9758 4.06041 18.5174C3.60198 18.0589 3.34444 17.4372 3.34444 16.7889V7.01111"
          stroke={color ?? 'currentColor'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.23333 15.5667L11.9 19.2333L8.23333 22.9"
          stroke={color ?? 'currentColor'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

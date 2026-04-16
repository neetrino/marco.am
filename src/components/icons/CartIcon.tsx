'use client';

interface CartIconProps {
  /**
   * Icon size in pixels (used when className does not set width/height).
   */
  size?: number;
  /**
   * Utility classes — use `text-*` for color (inherits `currentColor`).
   */
  className?: string;
}

const VIEW_BOX_SIZE = 24;

/**
 * Shopping cart with centered plus — line icon aligned with MARCO Figma (cart + add).
 * Stroke uses `currentColor` for buttons and headers.
 */
export function CartIcon({ size = 20, className = '' }: CartIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${VIEW_BOX_SIZE} ${VIEW_BOX_SIZE}`}
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden
    >
      {/* Handle */}
      <path
        d="M4 5.5L6 7.5"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
      />
      {/* Open-top basket: left, bottom, right, top rim */}
      <path
        d="M6 7.5L8.25 16.5H17.5L19.5 7.5H8"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Wheels */}
      <circle cx="10.25" cy="19" r="1.35" fill="currentColor" />
      <circle cx="16.25" cy="19" r="1.35" fill="currentColor" />
      {/* Plus inside basket */}
      <path
        d="M12 9.25v4.5M9.75 11.5h4.5"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
      />
    </svg>
  );
}

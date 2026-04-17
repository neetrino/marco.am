interface HeaderNavbarWishlistIconProps {
  /**
   * Utility classes — use `text-*` for color (`currentColor`).
   * Figma MARCO `242:1774` / Frame `111:4285` (Frame 9223 strip) — wishlist outline heart.
   */
  className?: string;
  /**
   * Stroke width; Figma toolbar strip uses ~1.8 to match compare glyph.
   */
  strokeWidth?: number;
}

const VIEWBOX = 24;

/**
 * Navbar wishlist heart — outline matching header icon strip (Figma MARCO Frame 9223, node 242:1774).
 */
export function HeaderNavbarWishlistIcon({
  className = '',
  strokeWidth = 1.8,
}: HeaderNavbarWishlistIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

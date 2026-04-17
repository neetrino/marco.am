interface HeaderNavbarCartIconProps {
  /**
   * Utility classes — use `text-*` for color (`currentColor`).
   * Figma MARCO 111:4283 — ~22×21px glyph in black cart pill.
   */
  className?: string;
}

const VIEW_BOX = 24;

/**
 * Navbar cart total pill — open-top trolley, two wheels (no “+” inside).
 * Matches Figma header cart control; distinct from {@link CartIcon} (add-to-cart with plus).
 */
export function HeaderNavbarCartIcon({ className = '' }: HeaderNavbarCartIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${VIEW_BOX} ${VIEW_BOX}`}
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M4 5.5L6 7.5"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
      />
      <path
        d="M6 7.5L8.25 16.5H17.5L19.5 7.5H8"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10.25" cy="19" r="1.35" fill="currentColor" />
      <circle cx="16.25" cy="19" r="1.35" fill="currentColor" />
    </svg>
  );
}

type NoPriceLockIconProps = {
  readonly className?: string;
};

/**
 * Price-locked glyph shown when product has no display price.
 */
export function NoPriceLockIcon({ className }: NoPriceLockIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M32 20H16C14.8954 20 14 20.8954 14 22V34C14 35.1046 14.8954 36 16 36H32C33.1046 36 34 35.1046 34 34V22C34 20.8954 33.1046 20 32 20Z"
        fill="currentColor"
      />
      <path
        d="M20 20V16C20 13.7909 21.7909 12 24 12C26.2091 12 28 13.7909 28 16V20"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

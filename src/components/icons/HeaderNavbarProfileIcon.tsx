interface HeaderNavbarProfileIconProps {
  /**
   * Utility classes — `text-*` sets stroke via `currentColor` (e.g. `text-white` on accent button).
   */
  className?: string;
}

const VIEWBOX_W = 21;
const VIEWBOX_H = 23;

/**
 * Navbar profile (person) outline — source `Vector.svg` (21×23, stroke 2.4).
 */
export function HeaderNavbarProfileIcon({ className = '' }: HeaderNavbarProfileIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M15.2625 6.2C15.2625 7.52608 14.7291 8.79785 13.7797 9.73553C12.8303 10.6732 11.5426 11.2 10.2 11.2C8.85729 11.2 7.56963 10.6732 6.62022 9.73553C5.67082 8.79785 5.13745 7.52608 5.13745 6.2C5.13745 4.87392 5.67082 3.60215 6.62022 2.66447C7.56963 1.72678 8.85729 1.2 10.2 1.2C11.5426 1.2 12.8303 1.72678 13.7797 2.66447C14.7291 3.60215 15.2625 4.87392 15.2625 6.2ZM19.2 21.2V18.9778C19.2 17.799 18.7258 16.6686 17.8819 15.8351C17.038 15.0016 15.8934 14.5333 14.7 14.5333H5.69995C4.50648 14.5333 3.36188 15.0016 2.51797 15.8351C1.67406 16.6686 1.19995 17.799 1.19995 18.9778V21.2H19.2Z"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="square"
      />
    </svg>
  );
}

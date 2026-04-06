import Image from 'next/image';
import Link from 'next/link';

/** Figma 111:4321 — exported PNG intrinsic pixels */
const MARCO_LOGO_INTRINSIC_WIDTH = 1080;
const MARCO_LOGO_INTRINSIC_HEIGHT = 1350;

/**
 * MARCO GROUP logo — Figma 111:4321 (`logo aranc fon 1`).
 * Raster is cropped/zoomed inside an 83×73 frame to match the header composition.
 */
export function MarcoLogo() {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marco-black"
      aria-label="MARCO GROUP Home"
    >
      <span className="relative aspect-[83/73] h-10 w-auto shrink-0 overflow-hidden md:h-12 min-[1800px]:h-[73px]">
        <Image
          src="/assets/brand/marco-group-logo.png"
          alt=""
          width={MARCO_LOGO_INTRINSIC_WIDTH}
          height={MARCO_LOGO_INTRINSIC_HEIGHT}
          className="absolute -left-[48.54%] -top-[75.88%] h-[278.35%] w-[197.08%] max-w-none"
          priority
          sizes="(min-width: 1800px) 83px, (min-width: 768px) 48px, 40px"
        />
      </span>
    </Link>
  );
}

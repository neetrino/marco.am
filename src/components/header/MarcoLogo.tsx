import Image from 'next/image';
import Link from 'next/link';
import {
  HEADER_LOGO_DISPLAY_HEIGHT_DESKTOP_CLASS,
  HEADER_LOGO_DISPLAY_HEIGHT_MOBILE_CLASS,
} from '@/constants/headerLogo';
import { SITE_LOGO_SRC } from '@/lib/constants/site-brand';

/** Figma 111:4321 — exported PNG intrinsic pixels */
const MARCO_LOGO_INTRINSIC_WIDTH = 1080;
const MARCO_LOGO_INTRINSIC_HEIGHT = 1350;

/**
 * `next/image` uses `sizes` to pick a downscaled CDN URL. This logo is heavily cropped/zoomed via CSS;
 * if `Sizes` matches only the ~36–40px header slot, production serves too few pixels and the glyph looks soft.
 * Hint a larger width so the visible crop stays sharp (dev uses `images.unoptimized` and bypasses this).
 */
const MARCO_LOGO_SIZES = '(min-width: 768px) 768px, 640px';

type MarcoLogoProps = {
  readonly ariaLabel?: string;
};

/**
 * MARCO GROUP logo — Figma 111:4321 (`logo aranc fon 1`).
 * Raster is cropped/zoomed inside an 83×73 frame; md+ height matches `HEADER_ROW2_BAR_HEIGHT_CLASS` (row-2 search strip).
 */
export function MarcoLogo({ ariaLabel = 'MARCO GROUP Home' }: MarcoLogoProps) {
  const heightClass = `${HEADER_LOGO_DISPLAY_HEIGHT_MOBILE_CLASS} ${HEADER_LOGO_DISPLAY_HEIGHT_DESKTOP_CLASS}`;

  return (
    <Link
      href="/"
      prefetch
      className={`flex ${heightClass} shrink-0 items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marco-black`}
      aria-label={ariaLabel}
    >
      <span className={`relative aspect-[83/73] w-auto shrink-0 overflow-hidden ${heightClass}`}>
        <Image
          src={SITE_LOGO_SRC}
          alt=""
          width={MARCO_LOGO_INTRINSIC_WIDTH}
          height={MARCO_LOGO_INTRINSIC_HEIGHT}
          className="absolute -left-[48.54%] -top-[75.88%] h-[278.35%] w-[197.08%] max-w-none"
          priority
          quality={100}
          sizes={MARCO_LOGO_SIZES}
        />
      </span>
    </Link>
  );
}

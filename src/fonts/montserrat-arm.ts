import localFont from 'next/font/local';

/**
 * Figma «Montserrat arm» — Montserrat Armenian (hy), not Google Montserrat.
 * Armenian glyphs are a separate OFL family; Google Fonts does not ship them.
 * @see https://github.com/greghub/montserrat-arm
 */
export const montserratArm = localFont({
  src: [
    {
      path: './montserrat-arm/Montserrat_am3-Regular.woff',
      weight: '400',
      style: 'normal',
    },
    {
      path: './montserrat-arm/Montserrat_am3-Bold.woff',
      weight: '700',
      style: 'normal',
    },
    /** Repo ships up to Bold; map Black (900) to the same face so weight matches design. */
    {
      path: './montserrat-arm/Montserrat_am3-Bold.woff',
      weight: '900',
      style: 'normal',
    },
  ],
  display: 'swap',
  fallback: ['Montserrat', 'system-ui', 'sans-serif'],
});

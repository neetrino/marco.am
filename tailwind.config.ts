import type { Config } from 'tailwindcss';

import { MARCO_SLATE_HEX } from './src/lib/constants/marco-brand-colors';

const MARCO_ANTHRACITE = '#383838';
const MARCO_YELLOW = '#ffca03';

const config: Config = {
  darkMode: 'class',
  // Use `./shared/ui/*` (no `**`) — on Windows `shared/ui/**/*.js` can match into
  // `node_modules` and stall Tailwind + first-request compile. Files live at package root only.
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './shared/ui/*.{js,ts,jsx,tsx}',
  ],
  /**
   * `lg` at 1200px — Z Fold unfolded (~884px CSS) stays below `lg`; iPad at 1024–1199 matches that band (`md` / `max-lg`), not desktop `lg` yet.
   */
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1200px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      /**
       * Mega menu left rail: bottom inset so the last category clears the floating scroll control
       * without excess empty space (tune between ~72px tight and ~120px loose).
       */
      padding: {
        'header-mega-category-scroll-end': '48px',
      },
      scrollPadding: {
        'header-mega-category-scroll-end': '48px',
      },
      colors: {
        primary: MARCO_ANTHRACITE,
        secondary: '#FFFFFF',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
        marco: {
          yellow: MARCO_YELLOW,
          black: MARCO_ANTHRACITE,
          slate: MARCO_SLATE_HEX,
          gray: '#f4f4f4',
          border: '#ebebeb',
          text: '#333333',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
        mulish: ['var(--font-mulish)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

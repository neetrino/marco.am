import type { Config } from 'tailwindcss';

const config: Config = {
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
      colors: {
        primary: '#000000',
        secondary: '#FFFFFF',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
        marco: {
          yellow: '#ffca03',
          black: '#101010',
          gray: '#f4f4f4',
          border: '#ebebeb',
          text: '#333333',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
        heading: ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

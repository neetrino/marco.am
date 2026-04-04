import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    'shared/ui/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        /** Figma product card brand red — use as text-primary-500 */
        'primary-500': '#af1b1b',
        /** Figma title/price / dark UI */
        'neutral-900': '#171717',
        'neutral-400': '#9ca3af',
        /** Figma card surface */
        'surface-default': '#f6f6f6',
        secondary: '#FFFFFF',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
        gold: '#facc15',
        'hero-blue': '#2f4b5d',
        darkslategray: '#2f4b5d',
        /** Product card: brand name (Figma) */
        'product-card-brand': '#af1b1b',
        /** Product card: accent yellow — discount bg, warranty text, stars, add-to-cart */
        'accent-yellow': '#ffca03',
        /** Product card: warranty / action button background */
        'product-card-overlay': '#1e1e1e',
        /** Product card: title and price text (Figma #181111 / #171717) */
        'product-card-text': '#171717',
        surface: {
          default: '#f6f6f6',
          elevated: '#f9fafb',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
        heading: ['system-ui', '-apple-system', 'sans-serif'],
        'montserrat-arm': ['var(--font-montserrat-arm)', 'Montserrat', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        card: '32px',
        badge: '24px',
        /** Product card: image container (Figma 8px) */
        'product-image': '8px',
        /** Product card: warranty badge (Figma 16px) */
        'product-badge-warranty': '16px',
        /** Product card: discount badge pill (Figma 24px) */
        'product-badge-discount': '24px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        chat: '0px 4px 24px 0px rgba(150,150,150,0.28)',
        /** Figma add-to-cart halo (approx from asset inset) */
        'product-cta': '0 0 0 8px rgb(255 255 255 / 0.95), 0 8px 24px rgb(0 0 0 / 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;

